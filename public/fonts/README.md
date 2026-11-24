# App fonts

Inter and Noto Sans TC are distributed under SIL OFL 1.1; the licence texts beside the fonts include their copyright notices. These are the Google Fonts WOFF2 unicode slices, without font-data modifications. The variable range 400–700 contains the required 400, 600 and 700 weights.

Sources: https://github.com/google/fonts/tree/main/ofl/inter and https://github.com/google/fonts/tree/main/ofl/notosanstc. Exact asset URLs, sizes, unicode ranges and SHA-256 hashes are in `scripts/fonts/manifest.json`.

`npm run fonts:generate` verifies local hashes and generates `src/styles/fonts.css` without network access. `npm run fonts:generate -- --download` explicitly restores the same pinned assets, checking their hashes before writing them. Normal builds use only committed files; there are no remote font requests. The PDF font under `assets/fonts/` is independent and unchanged.
