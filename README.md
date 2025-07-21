# Pomodoro Timer App

A modern, customizable Pomodoro timer built with HTML, CSS, and JavaScript.
Features a clean glassmorphic UI, gentle notifications, offline capability, and user-configurable session logic—all designed for focused productivity and a delightful user experience.

---

## Features

- **Session Control:**
  - Set custom Work, Break, Long Break, and Sessions per cycle durations.
  - Automatic cycle tracking and a long break after completing your chosen session count.

- **Clean User Interface:**
  - Minimalist, glassmorphic design that works beautifully on desktop and mobile.
  - One-click settings menu for adjusting session times, accessible from anywhere.

- **Gentle Notifications:**
  - Custom toast notifications for transitions (e.g., “Work session complete! Break starting…”).
  - Soft, local alarm sound when sessions end (see `mixkit-happy-bell-alert-601.wav`).

- **Accessibility & Usability:**
  - Focused keyboard navigation, ARIA live regions for session status.
  - All user actions provide immediate, non-jarring feedback.

- **Persistent Settings:**
  - All settings (durations, cycles) stored locally and persist across sessions.

- **PWA Ready:**
  - Includes `manifest.json` and `service-worker.js` for offline support and “Install App” experience.
  - Deployable via GitHub Pages, Netlify, Vercel, etc.

---

## Usage

- **Start/Pause/Reset** your Pomodoro timer using the main controls.
- Hit the **⚙️ Settings** button to open the session options menu and adjust your timer, break, and cycle durations as desired.
- Toast notifications and a soft alarm will gently signal when to switch focus modes.
- Fully supports desktop and mobile browsers.

---

## Deployment

1. **Local use:**
   Just open `index.html` in your browser.

2. **Web hosting & PWA:**
   - Deploy the static files on [GitHub Pages](https://pages.github.com/), [Netlify](https://www.netlify.com/), or [Vercel](https://vercel.com/).
   - For offline use and installability, `manifest.json` and `service-worker.js` are already included.

3. **Play Store publishing:**
   - Wrap as a PWA with [PWABuilder](https://www.pwabuilder.com/) or [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
   - Use GitHub Pages or another free HTTPS host as your backend.

---

## Customization

- **Alarm Sound:**
  Replace the alarm audio file (`mixkit-happy-bell-alert-601.wav`) in the `<audio>` tag with your preferred chime if desired.
- **Session Durations:**
  Change default session and break times in code or via the settings menu.

---

## PWA Setup (Already Included)

1. `manifest.json` with app name, icons, and theme colors is included.
2. `service-worker.js` for offline caching is included.
3. The `<head>` in `index.html` includes the manifest and theme color meta tag.
4. Service worker registration is handled at the end of `index.html`.

---

## Credits

- Alarm sound: [mixkit-happy-bell-alert-601.wav](https://mixkit.co/free-sound-effects/bell/) (Mixkit)

---

## License

MIT
