/* ==========================================================================
   WEDDING CONFIGURATION — the only file you need to edit.

   - Every field starts empty. Empty fields are hidden automatically.
   - Any text field can be a plain string, or an object with both languages:
       groomName: { ar: "…", en: "…" }
   - weddingDate: "YYYY-MM-DD"   (e.g. 2027-06-12)  → enables the countdown
   - weddingTime: "HH:MM" 24-hour (e.g. 18:30)      → shown in the visitor's language
   - eventSchedule: one item per line, "time | title"
                    (or an array of { time, title })
   - googleMapsLink: a full link starting with https://
   - musicFile: path to your audio, e.g. "assets/audio/music.mp3"
   - language: "ar", "en", or "" (auto-detect from the visitor's device)
   ========================================================================== */

window.WEDDING_CONFIG = {
  groomName: "",
  brideName: "",
  weddingDate: "",
  weddingTime: "",
  venueName: "",
  venueAddress: "",
  googleMapsLink: "",
  invitationMessage: "",
  personalMessage: "",
  eventSchedule: "",
  rsvpDetails: "",
  musicFile: "",
  language: ""
};
