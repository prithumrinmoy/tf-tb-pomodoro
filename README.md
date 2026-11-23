# TF/TB Pomodoro

A responsive Pomodoro timer built with React + Vite. It includes separate customizable Focus (TF) and Break (TB) timers, local background music, fullscreen and compact modes, browser notifications, keyboard shortcuts, and a creator profile section.

## Requirements

- Node.js 18 or newer
- VS Code (recommended)
- Git and a GitHub account
- A Vercel account for deployment

## 1. Run locally in VS Code

1. Extract the ZIP file.
2. Open the extracted `tf-tb-pomodoro` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

```bash
npm install
npm run dev
```

5. Open the local URL printed in the terminal, usually `http://localhost:5173`.

## 2. Personalize your details

Open `src/App.jsx` and find the `profile-modal` section near the bottom.

Replace:
- `https://www.linkedin.com/in/YOUR-LINKEDIN/`
- `https://github.com/YOUR-GITHUB`
- `YOUR-EMAIL@example.com`

You can also edit your displayed name, degree, and short bio in the same section.

## 3. How uploaded music works (no database)

- Music is optional. The timer works normally if a user never uploads music.
- Click **UPLOAD MUSIC** and choose an audio file from your computer when you want music.
- The browser plays the selected local file using a temporary object URL.
- The file is not saved in IndexedDB, local storage, a database, or cloud storage.
- The file is not uploaded to Vercel or any server.
- When the page is refreshed or closed, the temporary music selection is lost. The user uploads it again next time if desired.
- Click the remove-track control to stop and unload the selected track.
- Audio playback may pause when the browser or device suspends the tab. For best results, keep the app tab open.

## 4. Push to GitHub

Create a new empty repository on GitHub, then run these commands in the VS Code terminal from the project folder:

```bash
git init
git add .
git commit -m "Initial TF TB Pomodoro project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tf-tb-pomodoro.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Do not commit personal music files.

## 5. Deploy free on Vercel

1. Sign in at https://vercel.com using GitHub.
2. Click **Add New → Project**.
3. Import your `tf-tb-pomodoro` GitHub repository.
4. Vercel should detect Vite automatically.
5. Confirm:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
6. Click **Deploy**.

When you push future commits to the connected GitHub repository, Vercel will automatically build and deploy the updates.

Alternative: install the Vercel CLI and run `npx vercel` from the project directory.

## 6. Features and shortcuts

| Shortcut | Action |
|---|---|
| Space | Start / pause current timer |
| R | Reset current timer |
| F | Toggle fullscreen |
| M | Toggle compact / minimize mode |
| Esc | Close open dialog |

Default durations are 50 minutes focus and 10 minutes break. Use Settings to customize them or select a preset (25/5, 50/10, 90/15).

## Notes

- This is a frontend-only project. No database (including browser IndexedDB), backend, API key, or paid service is required.
- Timer duration preferences and completed-session count use localStorage only. Music files are never persisted. If you want absolutely no browser storage at all, remove the two localStorage uses for timer preferences and session count in `src/App.jsx`.
- Browser notifications require permission and are not guaranteed if the browser or device is fully closed.
- Fullscreen is subject to browser permissions and user-gesture requirements.
- The timer continues using system time while the page is open, including when the tab is in the background.
- Uploaded audio is local to the browser and is not shared across devices.
