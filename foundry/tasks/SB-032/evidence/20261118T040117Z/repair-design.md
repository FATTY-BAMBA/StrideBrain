# S9-F01 scoped repair design

Base: 4df07c23a2896b5c13b96238f078d22941a55222. Prior browser run 20261118T031855Z remains FAIL and unchanged.

The Projects route was still the original static FoundationPage placeholder. Existing authorized workspace and locale-preserving route generation are reused.

The existing ProjectRepositoryPort only reads a single authorized business key, and its record excludes display names. The new bounded ProjectListRepositoryPort selects only id/organization/business key/localized names/status. One Prisma query uses trusted organization, non-deleted rows and existing assignment/admin scope before fetching names. Missing project-read capability or missing non-admin assignments performs no list query. No commercial/evidence relations, hidden totals or fixture-specific links are loaded.

ListAuthorizedProjects rechecks same organization and AuthorizationService.canReadProject before accessing presentation fields. Its DTO contains only businessKey, localized name and active boolean. Authorization remains the existing server-resolved capability/assignment policy. Viewer may see projects already assigned/readable under that policy; financial/evidence/action restrictions remain unchanged. Northern receives only its own authorized projects. The page consumes no browser organization/role/project selectors. Invalid identity, empty list and storage error share neutral localized UI without project details.

The list is server-rendered with native links, project-name headings, localized Open project wording and existing projectSurfaceHref encoding. Minimal single-column cards wrap at narrow widths with visible keyboard focus. Public Projects heading/description no longer names the canonical fixture before authorization. No other page copy is changed.

No schema, migrations, permissions, financial authority, evidence authority, action policy, AI, deployment or DNS changes. No broad directory/CRUD/search or project-management features. One query per list, authorization checks in memory, no per-project database round trips.

Regression layers: application filtering-before-mapping including throwing denied-field getters; exact repository select/predicates and 300-row one-query check; server page/semantic link/locales/empty-error/selector isolation; real PostgreSQL plus signed Mei/Finance/Admin/Viewer/Northern identities. Actual keyboard and viewport outcomes remain browser acceptance work.

Independent review addendum: narrow WorkspaceShell → GlobalNav props to five nav labels, preventing unrelated fixture copy from serializing into unauthorized Projects responses. This is necessary response non-disclosure, not a navigation redesign.
