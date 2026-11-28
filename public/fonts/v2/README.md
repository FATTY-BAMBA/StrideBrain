# Google Sans for the sign-in button

Google Sans Medium (500), Google Fonts v76, self-hosted under `GoogleSans-OFL.txt`.
The Google Fonts CSS2 API generated the official WOFF2 subset for the two fixed English
labels; `scripts/fonts/manifest.json` pins the complete source URL, byte size, SHA-256 and
Unicode range. Regenerate with `npm run fonts:generate`; only its explicit `--download`
option uses a network. The browser loads `/fonts/v2/google-sans.woff2` from this app only.
Chinese characters retain the existing local Noto Sans TC fallback.

Sources: https://fonts.google.com/specimen/Google+Sans and
https://github.com/google/fonts/tree/main/ofl/googlesans (SIL Open Font License 1.1).
Future changes to these font bytes require a new version folder.
