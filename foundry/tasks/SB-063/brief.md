# SB-063 — Job pages and closed-job cost difference

Issue: https://github.com/FATTY-BAMBA/StrideBrain/issues/63

Add the existing assistant to all four job tabs (overview, quote, comparison and actions), collapsed by default and scoped to the open job. The shared layout places one bar directly below the tabs and above the page content at the shared page width. Preserve the conversation between pages of that job and clear it on leaving. Named jobs still win. The layout controls only whether the optional bar appears; pages retain their own authorization and localized unavailable states. The editor shares its existing unsaved flag in client context so the panel warns that answers use the last saved draft, then clears the warning after saving. Show the exact quote-minus-reconciled-actual difference on Home in words and colour. Display saved findings one per line and retain earlier job-draft form state while collapsing all but the newest card.

No migrations or assistant tool/instruction/model/check changes. Follow delivery A → B → C. At most two paid AI evaluation workflow runs; never the Test site workflow. One draft PR until Product Director hosted acceptance.

Also correct SB-067 verification: Product Director confirmed older findings-list removal on 2026-11-25, PR #75 comment 7157102507.

Review round 1 re-read the issue update dated 2026-11-25 08:36Z and corrected the earlier three-page brief. The Product Director confirmed the job-specific placeholder at 17:32 Asia/Taipei on 25 November 2026, recorded in owner-authored comment 7158463671. It is decided, not provisional.
