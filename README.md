# Arcade Game Portal
Live on : https://arcadehub.telekit.link/
A lightweight, framework-free browser arcade built using pure HTML, CSS, and vanilla JavaScript.

## 🎮 Live Arcade Site (GitHub Pages)
This repository is configured for **GitHub Pages**. `index.html` serves as the primary entry point to access all individual game pages.

### Available Games:
- 🔢 **[2048](2048.html)** — Classic sliding tile puzzle game.
- 🚀 **[Asteroids](asteroids.html)** — Classic vector space-drift shooter game with dividing asteroids.
- 🎰 **[Bing Ball](bingball.html)** — Pachinko/Plinko style pin-drop game.
- 🧱 **[Breakout](breakout.html)** — Classic breakout brick-destroying arcade game.
- 🏃‍♂️ **[Cyber Runner](cyberrunner.html)** — Dodge laser fences and cyber hacker drones in a fast-paced neon runner.
- 🏎️ **[CyberRacer](cyberracer.html)** — Race down the retro digital superhighway, steer left/right to dodge barriers and retrieve energy nodes.
- 💻 **[Flappy Byte](flappybyte.html)** — Fly a data microchip through cyber motherboard columns.
- 🐤 **[Flappy Neon](flappybird.html)** — Classic flap-and-dodge mechanics in neon cyber style.
- 🏓 **[Pong](pong.html)** — Classic retro arcade paddle-and-ball game.
- 🛡️ **[Retro Tower Defense](towerdefense.html)** — Defend key database cores against ascending cyber viruses.
- 🐍 **[Snake Game](snakegame.html)** — Classic snake arcade action.
- 👾 **[Space Invaders](spaceinvaders.html)** — Classic space invaders arcade shooter.
- 🧩 **[Tetris](tetris.html)** — Classic falling block puzzle game.

---

## 🚀 Setting Up GitHub Pages

To publish this project to GitHub Pages:

1. **Push changes to GitHub:**
   ```bash
   git add index.html snakegame.html bingball.html breakout.html spaceinvaders.html tetris.html flappybird.html 2048.html pong.html flappybyte.html asteroids.html README.md
   git commit -m "Configure index.html as main entry point for GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub.
   - Click **Settings** > **Pages** (in the left sidebar).
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` (or `master`) and set folder to `/ (root)`.
   - Click **Save**.

Your site will automatically deploy and be accessible at:
`https://<your-github-username>.github.io/<repository-name>/`

---

## 🏗️ Architecture

The portal exposes shared utility modules to coordinate layout, persistence, settings, and features:

### 1. `ThemeManager` (`theme.js` & `styles/theme.css`)
Provides standard switching between `light`, `dark`, and `retro-neon` themes:
- Persists user preferences inside `localStorage` under the key `arcade-theme`.
- Automatically injects theme-specific CSS variables to `:root` and applies theme body classes.
- Publishes the CustomEvent `themechange` when the active theme is changed, dynamically notifying running canvas game loops to update colors.

### 2. `KeyManager` (`input.js`)
Centralizes controls and custom mappings for essential gameplay actions:
- Binds standard custom keys for `action` (e.g. flap/jump/shoot) and `pause` controls.
- Loads and persists key bindings inside `localStorage` under `arcade-keybindings`.
- Exposes an interactive Keybindings Settings Modal allowing custom keyboard mapping at runtime.

### 3. `Leaderboard` (`leaderboard.js` & `leaderboard.html`)
Combines score entries across all games into a global scoreboard:
- Aggregates the local high score records for all 13 arcade games.
- Provides search, sort, and reset capabilities via a responsive dashboard.

<!-- Test PR engine flow -->
