# Verification — SB-084

Implementation and checks pending. No hosted changes or paid evaluation.

## Decisions awaiting the Product Director

- Reviewer comment 7227915416: application-owned per-email rate-limit guard, its listed
  conditions, and example refusal copy are provisional.
- Issue #84 copy remains provisional except the confirmed 驗證碼 wording.

Session duration is confirmed: 30 days from sign-in, without activity extension.

## Existing job creator access

The create-project repository creates a ProjectAssignment for the creator in the same
transaction as the job. The People UI must expose the stored assignment, not imply a
separate permanent creator privilege.

## Not verified

All implementation checks, local fake-provider flows, screenshots and hosted acceptance.
