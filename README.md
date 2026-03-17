# Taskr — Responsive Task Manager

A clean, accessible single-page task manager built with vanilla HTML, CSS, and JavaScript.

## Live Demo

> Deploy to Netlify/Vercel/GitHub Pages and paste the link here.

## Features

- **CRUD** — Create, edit, complete, and delete tasks
- **Filter** — View All / Active / Completed tasks
- **Persistence** — Tasks saved to `localStorage` and survive page refresh
- **Fully Responsive** — Works on mobile (≥320px) and desktop
- **Accessible** — ARIA roles, keyboard navigation, focus trapping in modal, reduced-motion support
- **XSS-safe** — All user input rendered via `textContent`, never `innerHTML`

## Tech Choices

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Vanilla JS (IIFE) | Zero dependencies, fast load, no build step |
| Styling | Plain CSS with custom properties | Full control, no framework bloat |
| Storage | `localStorage` | Simple, synchronous, no backend required |
| Fonts | Syne + DM Sans (Google Fonts) | Distinctive display + readable body pair |
| Security | `textContent` for all user data | Prevents XSS injection at the DOM level |

## Setup

No build step required. Just open `index.html` in a browser, or serve with any static server:

```bash
npx serve .
# or
python -m http.server 8080
```

## Deployment

### Netlify (recommended)
1. Drag and drop the project folder into [app.netlify.com/drop](https://app.netlify.com/drop)
2. Done — live in ~10 seconds

### GitHub Pages
1. Push to a GitHub repo
2. Settings → Pages → Source: `main` / `root`
3. Live at `https://<user>.github.io/<repo>`

### Vercel
```bash
npx vercel --prod
```

## Security Notes

- All user input is inserted via `textContent` (not `innerHTML`) — XSS prevented at the DOM level
- Input is validated and sanitized (trimmed, length-checked) before storage
- No external data or API calls; fully client-side
- `localStorage` data is validated on load to reject malformed entries

## Bonus

JWT/OAuth authentication can be added by integrating a provider like Auth0 or Supabase Auth — the task state model is already structured for easy backend sync.

## Project Structure

```
├── index.html   # App shell, semantic HTML, ARIA attributes
├── style.css    # All styles, CSS variables, responsive + animations
├── app.js       # All logic: state, CRUD, render, events
└── README.md
```
