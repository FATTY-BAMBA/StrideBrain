# StrideBrain design system v1

This is the shared visual contract for every screen. Traditional Chinese comes first; every label has an English twin. Use plain CSS custom properties and the components in `src/components/ui/`. No utility framework, component library, icon package or CSS-in-JS dependency is required.

StrideBrain is for owners of small firms. Every screen and every answer must be easy and friendly, helping their day go better with less hassle. Use plain words instead of internal terms, names instead of codes, and show the thing the person asked for first.

## Rules

- A design value outside the tokens is a defect. Colour, typography, spacing, radii, control heights and the document shadow come from `src/styles/tokens.css`. Structural CSS (`grid`, `auto`, `0`, percentages, fractions, responsive breakpoints and intrinsic sizing) is not a design value. Never add new legacy tokens.
- One primary button per view. Its text names the action. Other actions use secondary, outline or quiet; destructive actions use danger.
- Every page starts with PageHeader: a small context line, the title, and actions on the right. Actions wrap below at narrow widths.
- Assistant answers use server-built record cards with named titles, quiet references, description-list rows and one source-page link; older answers retain their text view. Comparable record lists are tables directly on the page, without surrounding cards. Home decisions and closed-job lessons use the shared row list described below. Separate sections with space and a rule, not boxes.
- Status is a badge with words: 草稿 / Draft (neutral), 內部審查中 / In internal review (information), 已核發 / Issued (warning), 已接受 / Accepted (accent-soft), 定稿 / Final (ink reversed). The supplied colours vary in lightness and hue; words carry the meaning.
- Money and other compared figures align right and use tabular numerals. Formatting and permission checks stay in their existing domain/application paths.
- Interactive elements are real buttons, links or form controls. Every keyboard target has a visible 3px focus ring. Text contrast is at least 4.5:1, control borders and icons at least 3:1. Icons use currentColor and always have adjacent text or an accessible name.
- Every screen has empty, loading and error states and a role-without-money view. Never hide unauthorized figures with CSS: omit them from the data as before.
- Filters are ordinary GET forms and work without JavaScript. Do not add live filtering here.

## Tokens

The following is the v1 token table. The CSS file is authoritative. Legacy tokens and their migration allowances have been removed; the design gate permits no raw-value baseline.

| Custom property     | Value                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--canvas`          | `#ffffff`                                                                           |
| `--surface-subtle`  | `#f4f6f5`                                                                           |
| `--ink`             | `#14211d`                                                                           |
| `--muted`           | `#5d6d67`                                                                           |
| `--line`            | `#e3e8e5`                                                                           |
| `--line-strong`     | `#b8c7c0`                                                                           |
| `--line-control`    | `#7f918a`                                                                           |
| `--accent`          | `#186b54`                                                                           |
| `--accent-strong`   | `#0f503f`                                                                           |
| `--accent-soft`     | `#dceee7`                                                                           |
| `--accent-tint`     | `#f4faf7`                                                                           |
| `--on-accent`       | `#ffffff`                                                                           |
| `--neutral-soft`    | `#eef1f0`                                                                           |
| `--neutral-ink`     | `#3f4d48`                                                                           |
| `--info-soft`       | `#e3edf9`                                                                           |
| `--info-ink`        | `#1d4f91`                                                                           |
| `--warning-soft`    | `#f5ead6`                                                                           |
| `--warning-ink`     | `#6b4409`                                                                           |
| `--danger`          | `#a3261d`                                                                           |
| `--danger-soft`     | `#fbebe9`                                                                           |
| `--focus`           | `#2b72d6`                                                                           |
| `--font-family`     | `Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif` |
| `--text-display`    | `32px`                                                                              |
| `--leading-display` | `1.3`                                                                               |
| `--weight-display`  | `700`                                                                               |
| `--text-title`      | `24px`                                                                              |
| `--leading-title`   | `1.4`                                                                               |
| `--weight-title`    | `700`                                                                               |
| `--text-section`    | `18px`                                                                              |
| `--leading-section` | `1.5`                                                                               |
| `--weight-section`  | `700`                                                                               |
| `--text-lead`       | `17px`                                                                              |
| `--leading-lead`    | `1.5`                                                                               |
| `--weight-lead`     | `600`                                                                               |
| `--text-body`       | `15px`                                                                              |
| `--leading-body`    | `1.6`                                                                               |
| `--weight-body`     | `400`                                                                               |
| `--text-table`      | `14px`                                                                              |
| `--leading-table`   | `1.6`                                                                               |
| `--weight-table`    | `400`                                                                               |
| `--text-caption`    | `13px`                                                                              |
| `--leading-caption` | `1.5`                                                                               |
| `--weight-caption`  | `400`                                                                               |
| `--space-4`         | `4px`                                                                               |
| `--space-8`         | `8px`                                                                               |
| `--space-12`        | `12px`                                                                              |
| `--space-16`        | `16px`                                                                              |
| `--space-24`        | `24px`                                                                              |
| `--space-32`        | `32px`                                                                              |
| `--space-40`        | `40px`                                                                              |
| `--space-48`        | `48px`                                                                              |
| `--radius-cell`     | `6px`                                                                               |
| `--radius-control`  | `10px`                                                                              |
| `--radius-ask`      | `12px`                                                                              |
| `--radius-pill`     | `999px`                                                                             |
| `--control-cell`    | `32px`                                                                              |
| `--control-chip`    | `36px`                                                                              |
| `--control-default` | `44px`                                                                              |
| `--control-ask`     | `56px`                                                                              |
| `--shadow`          | `0 2px 12px rgba(18, 45, 37, 0.06)`                                                 |
| `--rule-hairline`   | `1px`                                                                               |
| `--rule-section`    | `2px`                                                                               |
| `--focus-width`     | `3px`                                                                               |
| `--focus-offset`    | `3px`                                                                               |
| `--icon-size`       | `18px`                                                                              |
| `--sidebar-width`   | `248px`                                                                             |
| `--page-width`      | `1120px`                                                                            |
| `--content-width`   | `1500px`                                                                            |
| `--table-min-width` | `720px`                                                                             |
| `--form-width`      | `480px`                                                                             |
| `--filter-width`    | `480px`                                                                             |

Type roles: display 32/1.3/700 is reserved for the Home greeting; page title 24/1.4/700; section heading 18/1.5/700; lead 17/1.5/600; body 15/1.6/400; table/document 14/1.6/400; caption 13/1.5/400. Use only weights 400, 600 and 700. No new text is smaller than 13px. Use Inter first, then Noto Sans TC, then system Chinese fonts.

Space steps are 4, 8, 12, 16, 24, 32, 40 and 48px. Radius roles are none (0, for flat rows), cell (6px), control (10px), ask (12px) and pill (999px). Control heights are cell 32px, chip 36px, default 44px and ask 56px. The shadow belongs to the quote document and provisionally the standalone identity sheet (review 7237737479), not record tables or the workspace shell. Layout dimensions have named tokens too; they are not extra spacing steps. The shared page container uses `--page-width` (1120px), centred and capped at the available width. The shell retains `--content-width` (1500px) for older page bodies.

## Shared components

All these components are server components by default. URL-aware navigation, error retry and the pending filter notice need client behavior. Import each component directly from its file.

| Component    | Use                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageHeader` | Required context and title; optional description and actions. It emits the page's h1.                                                                                                         |
| `Button`     | A real button, safe default type `button`; forms specify `submit`. Variants: primary, secondary, outline, quiet, danger. Supply action words; never use a clickable div.                      |
| `Field`      | A labelled input by default or `as="select"`. Supply a stable unique id, label and normal control props; hint/error IDs are connected through aria-describedby and errors set aria-invalid.   |
| `Badge`      | Pass a typed quote status and locale. It supplies the canonical worded status and tone.                                                                                                       |
| `Table`      | Caption, headings and body rows in a focusable horizontal scroll region. Use `NameCell` for the row heading, `NumericCell` for figures and the record's linked name as the row's entry point. |
| `Notice`     | Information, warning or error. Information/warning use role=status; an error uses role=alert. Text says what happened and what the person can do.                                             |
| `EmptyState` | A plain section with a heading, optional explanation and optional action, without a card.                                                                                                     |
| `Icon`       | Copied Lucide geometry, 18px and 1.6px currentColor stroke. `decorative` requires adjacent words; standalone icons require a `label`. Licence and source release are adjacent.                |

`RecordsState` provides localized retry states for the Quotes and Clients error boundaries. Its client boundary reads only the URL locale and never fetches business data. `FilterForm` keeps a native GET form and announces a loading notice on submit when JavaScript is available; it does not prevent navigation or fetch data. There is no route-level streaming loading boundary: the list must remain visible on an initial visit with JavaScript disabled. The shared UI module contains list layout, filter and paging styles.

SectionHeading renders an h2 in the section type scale with a strong rule and optional actions. FactsList is a semantic dl: labels use muted table text, values use ink, numeric values align right with tabular figures. Adjacent equal labels may group into one dt above their unchanged values; this is used for answer-card findings. No facts are combined or rewritten.

Dialog uses the native dialog element with showModal, a named heading, Escape dismissal, focus containment and return to the opener. It adds no new colour or shadow. Closing hides it immediately while URL navigation finishes. Route-backed triggers show a busy label until their dialog is ready.

Dialogs close through Close or Escape, never a backdrop click.

Settings diagnostic timing details use a closed disclosure, with durations in one decimal second.

## Document and navigation components

Paper and navigation Tabs:

- **Paper** (`src/components/ui/paper.tsx`): document surface in canvas over surface-subtle, line-strong border and the sole document shadow. Use table/document typography, space tokens, and internal scrolling when necessary. Do not use Paper as a card around lists.
- **Tabs** (`src/components/ui/tabs.tsx`): labelled links for navigation, or real buttons with the tab keyboard/ARIA pattern for in-page panels. Active text and the 2px rule use ink; other labels use muted. Never identify selection by colour alone.
- **SectionHeading**: h2 in the section type role with a full-width 2px ink rule, separated by token space. Optional adjacent actions remain secondary/quiet.

## Record rows and links

Home decisions and lessons use RowList: a semantic ul, hairline-separated rows without cards, radius or shadow. Each row contains a name, text, optional labelled figures and at most one action. The action aligns right when space permits and wraps below on narrow screens; text never clips or scrolls. Tables remain tables; a record's name is its link, with no separate Open column. Overview facts and Home closed-job figures use --facts-width (640px) to keep labels and values together.

Within main, ordinary sentence links use accent colour and an underline. Linked record names share the NameCell/recordLink/row-list name style: accent, lead weight, a control-default (44px) tap height and the global focus ring. Tabs, stage chips, pagination and button-styled links retain their explicit control styles without underlines. Linked name text aligns with adjacent text; negative start margin retains its hover padding. At 390px, a linked name wraps within the initially visible table area; other columns may scroll. Measure every text rectangle, including populated Actions.

Comparison findings are ordered row lists: an adjacent repeated title appears once above its group, and each unchanged sentence is in ink beside a quiet evidence button. Closest jobs are ranked hairline rows beneath a full-width SectionHeading. Comparison details is a plain disclosure. Use accent for actions; info colours belong to worded information badges. The token gate permits --focus only in outline declarations.

## Shell and responsive behavior

The shell uses surface-subtle for the sidebar and canvas for the page. Product and firm names are at the top; labelled navigation follows. Navigation links use ink. Planned Knowledge and Customer Care link to their existing pages, remain muted, retain the 規劃中 / Planned tag, and participate in keyboard navigation. Person, language, Settings and sign-out sit at the bottom. The current working area, including Settings, has aria-current. Viewer navigation preserves the existing capability-based omission of Clients.

Below 900px a native details/summary Menu disclosure replaces the sidebar with a compact product/current-area top bar. Navigation, account and language links remain usable without JavaScript. At 390px, record tables scroll inside their labelled focusable regions; the page itself must not scroll horizontally. Do not turn the table into stacked cards. Keep a skip link and logical DOM/tab order. Keyboard access and zoom must not depend on hover.

## Fonts and licences

The app serves committed WOFF2 files under `public/fonts/v1/`; unicode-range loads only needed slices and font-display is swap. Inter and Noto Sans TC include SIL OFL 1.1 texts beside the files. `scripts/fonts/manifest.json` pins source URLs, SHA-256 hashes, sizes and ranges. `npm run fonts:generate` verifies local files and regenerates CSS offline; its explicit `--download` option restores pinned assets. Normal builds never download fonts. `/fonts/v1/:path*` is served with `Cache-Control: public, max-age=31536000, immutable`. Changing a font means a new version folder (for example `v2/`), updated manifest and CSS paths, and a matching immutable header rule; never overwrite a font at an existing versioned URL. The font used by the quote PDF under `assets/fonts/` is unchanged.

[Inter source/licence](https://github.com/google/fonts/tree/main/ofl/inter), [Noto Sans TC source/licence](https://github.com/google/fonts/tree/main/ofl/notosanstc), [Google CSS2 slicing/variable-font API](https://developers.google.com/fonts/docs/css2), [Lucide source/licence](https://github.com/lucide-icons/lucide/tree/0.468.0).

Measure a fresh Traditional Chinese Home visit with cache disabled. If font transfer exceeds 1.5 MB, stop and report the measured size and options before proceeding. Repository font size is not the first-visit transfer size.

## CSS gate

The shell, record screens, comparison, evidence, review and Settings use the shared tokens. Legacy variables and raw-value baselines are not permitted.

`npm run design:check` scans every CSS file under src; it also runs in `npm run check` and CI. Only `src/styles/tokens.css` may define raw values, and that file may contain only custom-property declarations. Other files are checked for literal colours (including colour functions and named colours), non-token font-size and border-radius declarations. Comments, strings and URLs are ignored; raw fallbacks are checked. `currentColor` inherits the token colour and `transparent` paints no colour, so neither is a raw colour violation.

The design gate requires zero raw values in every CSS file and rejects legacy custom properties. There is no baseline or per-file allowance. Unit tests probe a raw colour and a legacy declaration.

## Quotes and job workspaces

Quote side controls use --quote-aside-width (320px) above 1100px. The comparison is a native closed disclosure above issue controls, opens for #quote-comparison, and shows at most five findings. It has no internal scrolling. Closed jobs offer no comparison run or refresh.

Quote-reference block titles use lead type and category titles use body type at lead weight. The View all link follows the five visible findings, with a section gap before past-price references. Firm document fields, job address controls and job reader facts cap at --facts-width. Card document-number values do not break internally.

The Quote editor uses Paper on a subtle backdrop, with an internally scrolling seven-column document and a totals footer outside that scroll region. Its settings column follows the paper below 1100px. Inputs are real controls with focus rings and row-order tabbing; all financial previews are server results. Suggestions appear once per pricing category, across every mapped section.

The Quotes price list uses the shared table, filter and pagination controls. Item suggestions and history use native buttons and linked source prices; Arrow Down reaches the first suggestion, Escape returns to the description, and Tab reaches every price/source. The quote comparison shares the settings column (below the document on narrow screens), loads independently, and uses the same finding sentences as the full comparison. Pending comparison work never disables the document's save or issue controls.

Quote item suggestions occupy a full-width table row immediately below the item. They are in normal table flow, with no absolute positioning against a table row. The suggestion panel is limited to the document box's visible inner width, even when the table is wider at 390px; description/unit, linked price/source, date and client wrap within it. A differing client price occupies its own following line. The panel stays horizontally visible while the table scrolls. Opening, loading and resizing reveal the panel within the document's own vertical scroll area, clear of the sticky header and totals; its height is bounded and longer lists scroll internally. Native buttons and links, focus return and the IME/caret rules remain. History stays beside its item. The comparison panel owns the findings list; the issue review retains its reminder without duplicating that list. Save confirmation has no comparison link.

Home never lists Compare as a decision. Only an Issue quote row may show the quiet secondary comparison hint: never run or out of date, linking to `quote#quote-comparison` in the page language. Current comparisons show no hint. It adds no decision and is hidden without comparison and quote-amount access.

## Verification

Check both languages, owner and Viewer, keyboard focus, 390px overflow, filters and paging without JavaScript, empty/loading/error states, and actual font rendering/network origins. Preserve quote/client authorization and issued PDF bytes. Unknown, unassigned and other-organization jobs return the same not-found status and page on every tab, without job navigation. Unauthorized new-job routes also show not-found. Hosted acceptance belongs to the Product Director via the Test site workflow; agents do not deploy or mutate hosted systems.

## Sign-in and People

Sign-in, no-access and choose-firm are standalone: no workspace navigation, a centred
column capped at `--form-width`, the StrideBrain wordmark and visible 繁中 / EN links at
every width. Keep the existing sample-data notice. People uses PageHeader with one
Invite action and RowList with the name as the dialog entry. Status is a worded badge.
Native Dialog holds invitation or person fields; role and job access have one Save.
Serious actions name the person and require confirmation. Self-deactivation is hidden.
Switch firm is offered only for more than one firm. Copy from review 7231731273 is
provisional pending Product Director confirmation.

## Standalone identity sheet — review 7237737479

Sign-in, no-access and choose-firm share Paper on a full-height surface-subtle page,
with a top brand/language bar and copyright footer. Paper's existing shadow is the single
source; the identity sheet inherits it. The shadow and replaceable BrandMark are provisional
pending Product Director confirmation. Sheet body uses text-body, not Paper's table text.
The segmented language switch is scoped to this frame; workspace navigation is unchanged.
At 600px and below the page is canvas, sheet border/shadow disappear, content aligns at
the top and the test strip/footer follow at the bottom. No fixed-height clipping.

Only mode both shows the test strip. Mode real renders none of its badge, sentence or
sample-person link. Sign-in steps replace each other; Field owns field errors, Notice owns
request/query errors. Only the activated control changes its label during a request.
Code tracking is `--tracking-code: 0.3em`; all other non-Google values reuse existing tokens.

The custom Google button is the scoped branding exception: white fill, #747775 1px inside
border, #1f1f1f text, local Google Sans Medium 500 at 14px/20px, 12px side padding, 10px
mark gap, unmodified 20px standard-colour G and 4px rectangular radius. Its height stays
control-default (44px). These values have named `--google-*` tokens; the rest of the app
keeps weights 400/600/700. The asset/font source and licences are in public/brand/google
and public/fonts/v2. No font or script is fetched from another host in the browser.
