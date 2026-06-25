# La Poutine — Vieux-Québec 🍟

A small static website for a fictional Québec poutine restaurant, built as a **course project for MSE 543** (UX research / usability testing). The site is intentionally simple, usable, and instrumented so that user behaviour can be measured with Google Analytics (and, optionally, Microsoft Clarity heatmaps).

> ⚠️ **Research notice:** This website was created for a university course project and collects anonymized analytics data (page visits and click events) to study user experience. A disclosure banner and footer notice appear on every page.

---

## What's in the site

| Page | File | Purpose / user task |
|------|------|---------------------|
| Home | `index.html` | Landing page, brand story, signature poutines |
| Menu | `menu.html` | **Task 1:** Browse the full menu |
| Location & Hours | `location.html` | **Task 2:** Find hours & directions (today's hours auto-highlight) |
| Reservations | `reservations.html` | **Task 3:** Book a table (form + confirmation) |

Supporting files:

- `style.css` — all styling (shared across pages)
- `script.js` — form handling, today's-hours highlight, and analytics events
- `.nojekyll` — tells GitHub Pages to serve files as-is (no Jekyll processing)

### Three user-testing tasks
1. **Browse the menu** and find a specific dish.
2. **Find the restaurant's hours / location** and get directions.
3. **Make a reservation** for a given party size, date, and time.

---

## Tech

Plain **HTML + CSS + vanilla JavaScript** — no framework and no build step, so it deploys to GitHub Pages with zero configuration and is easy for any teammate to edit.

---

## Analytics setup

### Google Analytics 4 (required)
1. Go to [analytics.google.com](https://analytics.google.com) → **Admin → Create Property → Web**.
2. Copy your **Google tag** (`G-XXXXXXXXXX`).
3. In **all four** HTML files, find the `GOOGLE ANALYTICS` comment block in `<head>`, **uncomment it**, and paste your tag (replace both `G-XXXXXXXXXX` placeholders).

**Custom event (assignment requirement):** When a user submits the reservation form, `script.js` fires a custom GA4 event named **`reservation_submitted`** with parameters `party_size`, `reservation_date`, and `reservation_time`. It also tracks `cta_click` and `directions_click`. Until your real GA tag is added, these events safely no-op but still log to the browser **Console** (F12) so you can verify they fire.

### Microsoft Clarity — heatmaps (optional)
1. Sign in at [clarity.microsoft.com](https://clarity.microsoft.com) → **Add new project**.
2. Copy your **Project ID**.
3. In all four HTML files, find the `MICROSOFT CLARITY (OPTIONAL)` comment block in `<head>`, **uncomment it**, and replace `YOUR_CLARITY_ID`.

Clarity gives you click heatmaps and session recordings — useful for the qualitative "big data" analysis in the report.

---

## Analytics & custom event (for the report)

**Active GA4 property:** the live tag `G-SV3MWKVPN7` is installed on all four pages.

### Standard metrics GA4 collects (out of the box)
- **Page views & users** — how many people reach each page (Home, Menu, Location, Reservations).
- **Navigation paths** — which page users come from / go to next (Reports → Engagement → Pages, and the Path exploration).
- **Engagement / time on page** — how long users spend on each page; useful for spotting confusion or drop-off.
- **Enhanced measurement** — scrolls and outbound clicks are auto-tracked (enabled on the data stream).

### Custom event — `reservation_submitted` (the assignment's required custom element)
Defined in `script.js`, this event fires **only when a user successfully completes the reservation task** (passes form validation and submits).

| Field | Value |
|-------|-------|
| Event name | `reservation_submitted` |
| Parameter `party_size` | number of guests selected |
| Parameter `reservation_date` | chosen reservation date |
| Parameter `reservation_time` | chosen reservation time |

**Why it matters for the report:** this is a direct **task-success / conversion** signal — it lets you measure *how many users who reached the Reservations page actually completed a booking*, and segment that by party size, date, or time. Pairing the drop-off (users who reached the page but never fired the event) with user-testing observations is exactly the kind of combined "big data + small data" story the midterm asks for.

**Two supporting custom events** are also tracked in `script.js`:
- `cta_click` — clicks on primary call-to-action buttons (label captured), to see which CTAs drive navigation.
- `directions_click` — clicks on the "Get directions" link on the Location page.

### Make it a Key event (recommended)
In GA → **Admin → Events**, once `reservation_submitted` has fired at least once, toggle **Mark as key event**. GA will then report it as a conversion, giving you a clean task-completion rate.

### Verifying events fire
Open the site, submit a reservation, and check GA → **Reports → Realtime → Event count by Event name**. Before GA is connected (or for quick local checks), every event also logs to the browser **Console** (F12).

---

## 🚀 Quick GitHub Pages deploy guide

The code is pushed to GitHub. To make the site **live**, turn on Pages once:

1. Go to the repo on GitHub: **`https://github.com/d-lino-kee/la-poutine-website`**
2. Click **Settings** (top nav) → **Pages** (left sidebar).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to **`main`** and folder to **`/ (root)`**, then click **Save**.
5. Wait ~1 minute. Your live URL appears at the top of the Pages screen:

   **https://d-lino-kee.github.io/la-poutine-website/**

That's it. 🎉

### Pushing future changes
```bash
git add .
git commit -m "Describe your change"
git push
```
GitHub Pages redeploys automatically within a minute or so.

### Testing locally before pushing
Just open `index.html` in your browser, or run a tiny local server:
```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

---

## Reminders for user testing
- Ask testers to use a **normal browser** (not Incognito / privacy browser) so Google Analytics records their session.
- It can take **24–48 hours** for some GA reports to populate (use **Realtime** to confirm tracking works immediately).
