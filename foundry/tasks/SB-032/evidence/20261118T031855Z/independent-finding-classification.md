# Independent classification — S9-F01

Reviewer: independent delegated reviewer `sb032_entry_classification` (read-only).

Verdict: **required-path P2**, blocking S9-02. The accepted plan and build contract explicitly require Home → Projects → Xinyi Workspace in both locales and all four viewports. Desktop screenshots were independently inspected; the recorded viewport matrix supports the same absence of main-content links/buttons at the other widths. The product route renders only a settled placeholder. Direct workspace tests do not cover the global entry path.

The v0.1 allowance for honest limited shells does not waive this specific requirement. A complete project directory is not required. This is a newly observed pre-existing gap, not evidence that F-08 regressed. Do not mark all downstream PUX requirements failed merely because execution stopped.

A minimal repair is justified in principle: localized keyboard-operable entry to an existing server-authorized workspace, preserving tenant/capability/assignment checks and excluding unauthorized project names, identifiers and existence. Review the concrete candidate-selection design before implementation: ProjectRepositoryPort offers authorized business-key lookup, not an authorized listing contract. Restrict changes to necessary route/presentation/application-adapter wiring and tests. No portfolio CRUD/search, new permissions, broad enumeration, unconditional fixture link, schema or policy expansion.

Regression scope: both locales, authorized entry, denied/cross-tenant exclusion and the real Home → Projects → workspace path at all four viewports.

Pause affected hero execution and subsequent mutation/security waves. Do not bypass entry with a typed URL and count S9-02 as passed. Finalize evidence and cleanup. Classification does not authorize broad implementation. Reviewer made no file, browser, database or source changes.
