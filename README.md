# Digital Wedding Invitation

A premium, static wedding invitation (HTML + CSS + vanilla JS). No build step, no backend, no paid services. Supports Arabic (RTL) and English.

## Files

```
index.html            page structure
css/style.css         design
js/config.js          ← your wedding details (the only file you need to edit)
js/app.js             behaviour
assets/audio/         placeholder-music.wav (replace with your own song)
.nojekyll             tells GitHub Pages to serve files as-is
```

## 1. Add your details

Open `js/config.js` and fill in the fields. Empty fields, sections and buttons stay hidden automatically.

| Field | Format |
|---|---|
| `weddingDate` | `2027-06-12` (YYYY-MM-DD). Enables the countdown. |
| `weddingTime` | `18:30` (24-hour). Shown as 6:30 PM / ٦:٣٠ م. |
| `googleMapsLink` | Full link starting with `https://` |
| `eventSchedule` | One per line: `18:30 \| Ceremony` |
| `musicFile` | `assets/audio/music.mp3` |
| `language` | `"ar"`, `"en"`, or `""` to auto-detect |

Both languages in one invitation: any text field accepts `{ ar: "…", en: "…" }`.

```js
groomName: { ar: "…", en: "…" },
eventSchedule: "7:00 PM | Welcome\n8:00 PM | Dinner",
```

The countdown uses the guest's device time zone, and disappears once the date has passed.

## 2. Music

Put your audio file in `assets/audio/` (MP3 recommended, ideally under 3 MB), then set `musicFile`. Music never plays before the guest taps **Open Invitation**; after that they can mute or unmute with the floating button. If `musicFile` is empty or the file can't load, the music button is hidden.

## 3. Preview

- **Quickest:** double-click `index.html`.
- **Local server (recommended):** in this folder run `python3 -m http.server 8000`, then open http://localhost:8000.
- **On your phone:** on the same Wi-Fi, open `http://<your-computer-IP>:8000`.

Fonts load from Google Fonts, so previewing needs internet (system fonts are used as a fallback).

## 4. Publish on GitHub Pages (free)

1. Create a free account at github.com, then **New repository** (e.g. `wedding`), set it to **Public**.
2. Click **uploading an existing file**, drag in everything in this folder (including the `css`, `js`, `assets` folders and `.nojekyll`), and **Commit changes**.
3. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After about a minute your link appears: `https://<username>.github.io/<repo-name>/`. Share it with your guests.

To update later: edit `js/config.js` on GitHub (pencil icon) and commit. The site refreshes within a minute or two.
