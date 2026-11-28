# Google sign-in mark

`light-icon.png` is the unchanged 4× light square icon from Google's own
[asset bundle](https://developers.google.com/static/identity/images/signin-assets.zip),
entry `Android + Web/PNG @4x/Light/Theme=Light, Show text=No, Shape=Square, Platform=Android+Web@4x.png`,
downloaded 28 November 2026. Google's mark is used under its
[Sign in with Google branding guidelines](https://developers.google.com/identity/branding-guidelines).
It is not StrideBrain artwork and is not covered by the Lucide licence.

The asset is displayed at its 40px logical icon-button size within a 20px centred
window: only the surrounding bundled button border/padding is outside the window.
The standard-colour gradient G is neither recoloured, stretched nor redrawn.

Google Sans Medium is self-hosted in `public/fonts/v2` under the adjacent SIL OFL 1.1.
The Google Fonts CSS2 API supplied the small WOFF2 subset for the fixed English
button labels `Continue with Google` and `Please wait…`. The manifest pins its URL,
size and SHA-256. Chinese glyphs use the existing local Noto Sans TC fallback.
No browser request goes to Google for the mark, font, script or button rendering.
