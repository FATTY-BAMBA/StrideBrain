CREATE OR REPLACE FUNCTION pg_temp.jaccard_text(left_values text[], right_values text[])
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN cardinality(left_values) = 0 OR cardinality(right_values) = 0 THEN NULL
    ELSE (
      SELECT count(*)::numeric
      FROM (
        SELECT unnest(left_values) AS value
        INTERSECT
        SELECT unnest(right_values) AS value
      ) intersection_values
    ) / NULLIF((
      SELECT count(*)::numeric
      FROM (
        SELECT unnest(left_values) AS value
        UNION
        SELECT unnest(right_values) AS value
      ) union_values
    ), 0)
  END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.area_similarity(active_area numeric, candidate_area numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT greatest(
    0::numeric,
    1::numeric - abs(ln(candidate_area / active_area)) / ln(2::numeric)
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.recency_similarity(snapshot_date date, completed_date date)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT greatest(
    0::numeric,
    1::numeric - (((snapshot_date - completed_date)::numeric / 30.4375) / 60::numeric)
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.location_similarity(
  active_city text,
  active_district text,
  candidate_city text,
  candidate_district text
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(active_city) = lower(candidate_city)
      AND coalesce(lower(active_district), '') <> ''
      AND lower(active_district) = lower(candidate_district) THEN 1::numeric
    WHEN lower(active_city) = lower(candidate_city) THEN 0.6::numeric
    WHEN (lower(active_city), lower(candidate_city)) IN (
      ('taipei city', 'new taipei city'),
      ('new taipei city', 'taipei city')
    ) THEN 0.3::numeric
    ELSE 0::numeric
  END;
$$;

DO $$
DECLARE
  mismatch text;
  coverage_mismatch integer;
BEGIN
  WITH profiles AS (
    SELECT
      p."id",
      p."businessKey",
      p."comparisonClass",
      p."subtype",
      p."status",
      p."locationCity",
      p."locationDistrict",
      p."areaQuantity",
      p."areaUnit",
      p."currency",
      p."completedAt",
      coalesce(
        ARRAY(
          SELECT ps."categoryId"
          FROM "ProjectScope" ps
          WHERE ps."organizationId" = p."organizationId"
            AND ps."projectId" = p."id"
          ORDER BY ps."categoryId"
        ),
        ARRAY[]::text[]
      ) AS scopes,
      coalesce(
        ARRAY(
          SELECT DISTINCT quote_categories."categoryId"
          FROM (
            SELECT qi."categoryId"
            FROM "Quote" q
            JOIN "QuoteVersion" qv
              ON qv."quoteId" = q."id"
             AND qv."organizationId" = q."organizationId"
            JOIN "QuoteItem" qi
              ON qi."quoteVersionId" = qv."id"
             AND qi."organizationId" = qv."organizationId"
            WHERE q."organizationId" = p."organizationId"
              AND q."projectId" = p."id"
              AND qv."supersededById" IS NULL
              AND qv."authorityState" <> 'SUPERSEDED'
          ) quote_categories
          ORDER BY quote_categories."categoryId"
        ),
        ARRAY[]::text[]
      ) AS commercial_categories,
      coalesce(
        ARRAY(
          SELECT m."businessKey"
          FROM "ProjectMaterial" pm
          JOIN "Material" m
            ON m."id" = pm."materialId"
           AND m."organizationId" = pm."organizationId"
          WHERE pm."organizationId" = p."organizationId"
            AND pm."projectId" = p."id"
            AND m."active" = true
          ORDER BY m."businessKey"
        ),
        ARRAY[]::text[]
      ) AS materials,
      coalesce(
        ARRAY(
          SELECT s."businessKey"
          FROM "ProjectSupplier" ps
          JOIN "Supplier" s
            ON s."id" = ps."supplierId"
           AND s."organizationId" = ps."organizationId"
          WHERE ps."organizationId" = p."organizationId"
            AND ps."projectId" = p."id"
            AND s."active" = true
          ORDER BY s."businessKey"
        ),
        ARRAY[]::text[]
      ) AS suppliers
    FROM "Project" p
    WHERE p."organizationId" = 'org_horizon'
      AND p."deletedAt" IS NULL
      AND p."businessKey" IN (
        'PRJ-XINYI-026',
        'PRJ-NEIHU-021',
        'PRJ-ZHONGSHAN-018',
        'PRJ-NANJING-023',
        'PRJ-DAAN-016',
        'PRJ-SONGSHAN-020',
        'PRJ-BANQIAO-015'
      )
  ),
  active AS (
    SELECT *
    FROM profiles
    WHERE "businessKey" = 'PRJ-XINYI-026'
  ),
  factor_values AS (
    SELECT
      candidate."businessKey" AS project_key,
      candidate."completedAt" AS completed_at,
      CASE
        WHEN candidate."subtype" = active."subtype" THEN 1::numeric
        WHEN active."subtype" = 'RETAIL_FLAGSHIP'
          AND candidate."subtype" IN (
            'RETAIL_RENOVATION',
            'RETAIL_CONCEPT_STORE',
            'RETAIL_SHOWROOM'
          ) THEN 0.6::numeric
        ELSE 0::numeric
      END AS subtype_factor,
      pg_temp.jaccard_text(active.scopes, candidate.scopes) AS scope_factor,
      pg_temp.area_similarity(active."areaQuantity", candidate."areaQuantity") AS area_factor,
      pg_temp.jaccard_text(
        active.commercial_categories,
        candidate.commercial_categories
      ) AS commercial_factor,
      pg_temp.jaccard_text(active.materials, candidate.materials) AS material_factor,
      pg_temp.jaccard_text(active.suppliers, candidate.suppliers) AS supplier_factor,
      pg_temp.recency_similarity(date '2026-11-14', candidate."completedAt"::date) AS recency_factor,
      pg_temp.location_similarity(
        active."locationCity",
        active."locationDistrict",
        candidate."locationCity",
        candidate."locationDistrict"
      ) AS location_factor
    FROM active
    CROSS JOIN profiles candidate
    WHERE candidate."businessKey" <> active."businessKey"
      AND candidate."status" IN ('COMPLETED', 'CLOSED', 'ARCHIVED')
      AND candidate."comparisonClass" = active."comparisonClass"
      AND candidate."currency" = active."currency"
      AND candidate."areaUnit" = active."areaUnit"
  ),
  scored AS (
    SELECT
      project_key,
      completed_at,
      (
        15 * subtype_factor
        + 25 * scope_factor
        + 20 * area_factor
        + 15 * commercial_factor
        + 10 * material_factor
        + 5 * supplier_factor
        + 5 * recency_factor
        + 5 * location_factor
      )::numeric AS raw_score,
      (
        CASE WHEN subtype_factor IS NULL THEN 0 ELSE 15 END
        + CASE WHEN scope_factor IS NULL THEN 0 ELSE 25 END
        + CASE WHEN area_factor IS NULL THEN 0 ELSE 20 END
        + CASE WHEN commercial_factor IS NULL THEN 0 ELSE 15 END
        + CASE WHEN material_factor IS NULL THEN 0 ELSE 10 END
        + CASE WHEN supplier_factor IS NULL THEN 0 ELSE 5 END
        + CASE WHEN recency_factor IS NULL THEN 0 ELSE 5 END
        + CASE WHEN location_factor IS NULL THEN 0 ELSE 5 END
      )::integer AS evidence_coverage
    FROM factor_values
  ),
  ranked AS (
    SELECT
      project_key,
      round(raw_score)::integer AS display_score,
      evidence_coverage,
      row_number() OVER (
        ORDER BY raw_score DESC, evidence_coverage DESC, completed_at DESC, project_key ASC
      )::integer AS display_rank
    FROM scored
  ),
  expected(project_key, display_score, display_rank) AS (
    VALUES
      ('PRJ-NEIHU-021', 88, 1),
      ('PRJ-ZHONGSHAN-018', 81, 2),
      ('PRJ-NANJING-023', 79, 3),
      ('PRJ-DAAN-016', 71, 4),
      ('PRJ-SONGSHAN-020', 69, 5),
      ('PRJ-BANQIAO-015', 63, 6)
  )
  SELECT string_agg(
    format(
      '%s expected score/rank %s/%s but found %s/%s',
      coalesce(expected.project_key, ranked.project_key),
      expected.display_score,
      expected.display_rank,
      ranked.display_score,
      ranked.display_rank
    ),
    '; '
  )
  INTO mismatch
  FROM expected
  FULL JOIN ranked USING (project_key)
  WHERE expected.display_score IS DISTINCT FROM ranked.display_score
     OR expected.display_rank IS DISTINCT FROM ranked.display_rank;

  IF mismatch IS NOT NULL THEN
    RAISE EXCEPTION 'Stage 4 canonical ranking mismatch: %', mismatch;
  END IF;

  WITH profile_coverage AS (
    SELECT
      p."businessKey",
      cardinality(ARRAY(
        SELECT ps."categoryId"
        FROM "ProjectScope" ps
        WHERE ps."organizationId" = p."organizationId"
          AND ps."projectId" = p."id"
      )) AS scope_count,
      cardinality(ARRAY(
        SELECT m."businessKey"
        FROM "ProjectMaterial" pm
        JOIN "Material" m
          ON m."id" = pm."materialId"
         AND m."organizationId" = pm."organizationId"
        WHERE pm."organizationId" = p."organizationId"
          AND pm."projectId" = p."id"
      )) AS material_count,
      cardinality(ARRAY(
        SELECT s."businessKey"
        FROM "ProjectSupplier" ps
        JOIN "Supplier" s
          ON s."id" = ps."supplierId"
         AND s."organizationId" = ps."organizationId"
        WHERE ps."organizationId" = p."organizationId"
          AND ps."projectId" = p."id"
      )) AS supplier_count
    FROM "Project" p
    WHERE p."organizationId" = 'org_horizon'
      AND p."businessKey" IN (
        'PRJ-XINYI-026',
        'PRJ-NEIHU-021',
        'PRJ-ZHONGSHAN-018',
        'PRJ-NANJING-023',
        'PRJ-DAAN-016',
        'PRJ-SONGSHAN-020',
        'PRJ-BANQIAO-015'
      )
  )
  SELECT count(*)
  INTO coverage_mismatch
  FROM profile_coverage
  WHERE scope_count = 0 OR material_count = 0 OR supplier_count = 0;

  IF coverage_mismatch <> 0 THEN
    RAISE EXCEPTION
      'Stage 4 canonical profiles must have known scope, material, and supplier factors; % failed',
      coverage_mismatch;
  END IF;
END
$$;
