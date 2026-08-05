<!-- worker-execution-verification: verified -->
<!-- last-cron-run: 2026-08-04 -->
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
- 🧱 **[Cyber Breaker](cyberbreaker.html)** — High-octane neon matrix brick breaker game with EMP shockwaves, tri-ball powerups, and boss security cores.
- 🛡️ **[Cyber Siege](cybersiege.html)** — Defend the core matrix with Kinetic Shields, EMP shockwaves, and tri-beam lasers against virus swarms and Boss Dreadnoughts.
- 🏃‍♂️ **[Cyber Runner](cyberrunner.html)** — Dodge laser fences and cyber hacker drones in a fast-paced neon runner.
- 🏎️ **[CyberRacer](cyberracer.html)** — Race down the retro digital superhighway, steer left/right to dodge barriers and retrieve energy nodes.
- 💻 **[Cyber Hacker](cyberhacker.html)** — Intercept data packets, breach firewall security barriers, and deploy EMP pulses.
- ⚡ **[Cyber Dash](cyberdash.html)** — Fast-paced neon matrix lane dash arcade game with EMP shockwaves.
- ⚡ **[Cyber Surge](cybersurge.html)** — 360° vector matrix arena shooter with plasma surges, EMP shockwaves & Surge Singularity Bosses.
- ⚡ **[Cyber Overdrive](cyberoverdrive.html)** — High-octane matrix arena shooter & reflex dodger with plasma cannons, EMP shockwaves & Dreadnought Boss cores.
- 🌀 **[Cyber Vortex](cybervortex.html)** — High-octane orbital quantum core shooter with plasma beams, EMP vortex novas & Singularity Bosses.
- ⚡ **[Cyber Pulse](cyberpulse.html)** — High-voltage matrix wave shooter with plasma pulse beams, EMP shockwaves, kinetic surge shields & Titan Pulse Bosses.
- 🔮 **[Cyber Matrix](cybermatrix.html)** — High-octane phase-shifting quantum arena with dual-color laser bolts, EMP shockwaves, phase dash & Matrix Overlord Bosses.
- ⚡ **[Cyber Circuit](cybercircuit.html)** — High-voltage matrix pulse routing & node overload arcade game with EMP shockwaves & AI Core Overlords.
- 🔮 **[Cyber Nexus](cybernexus.html)** — High-voltage orbital quantum grid defender & firewall breach shooter with EMP shockwaves & Omega Dreadnought Bosses.
- ⚡ **[Cyber Storm](cyberstorm.html)** — High-octane orbital lightning matrix defense & tactical EMP pulse shooter with kinetic surge shields and storm titan boss encounters.
- ⚔️ **[Cyber Blade](cyberblade.html)** — High-octane 360° cyber katana deflector & quantum blade slicer arena game with EMP Novas and Shadow Dreadnought bosses.
- 🥷 **[Cyber Phantom](cyberphantom.html)** — High-octane 360° Quantum Stealth & Tactical Phase-Slicing Arena Fighter with shadow decoys and Phase Overlord Bosses.
- 🌀 **[Cyber Echo](cyberecho.html)** — High-octane 360° Quantum Time-Loop & Echo Decoy Tactical Arena Shooter with temporal ghost clones and Chrono-Overlord Bosses.
- 💻 **[Flappy Byte](flappybyte.html)** — Fly a data microchip through cyber motherboard columns.
- 🐤 **[Flappy Neon](flappybird.html)** — Classic flap-and-dodge mechanics in neon cyber style.
- 🐸 **[Neon Crossing](frogger.html)** — Classic Frogger-style crossing game in retro neon style.
- 🧠 **[Neon Simon](neonsimon.html)** — Watch the neon sequence, then repeat it back as it grows each round.
- 🏓 **[Pong](pong.html)** — Classic retro arcade paddle-and-ball game.
- 🛡️ **[Retro Tower Defense](towerdefense.html)** — Defend key database cores against ascending cyber viruses.
- 🐍 **[Snake Game](snakegame.html)** — Classic snake arcade action.
- 🧱 **[Sokoban](sokoban.html)** — Classic block-pushing puzzle in retro neon styling.
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
- Aggregates the local high score records for all 16 arcade games.
- Provides search, sort, and reset capabilities via a responsive dashboard.

<!-- Test PR engine flow -->

## Games

All game HTML files available in this repository:

| File | Game |
|------|------|
| [2048.html](2048.html) | 2048 — Classic sliding tile puzzle game |
| [asteroids.html](asteroids.html) | Asteroids — Classic vector space-drift shooter |
| [bingball.html](bingball.html) | Bing Ball — Pachinko/Plinko style pin-drop game |
| [breakout.html](breakout.html) | Breakout — Classic brick-destroying arcade game |
| [cyberbreaker.html](cyberbreaker.html) | Cyber Breaker — High-octane neon matrix brick breaker with EMP shockwaves & Boss Security Cores |
| [cyberdash.html](cyberdash.html) | Cyber Dash — Fast-paced neon matrix lane dash arcade game |
| [cybersiege.html](cybersiege.html) | Cyber Siege — Tactical matrix defense shooter with Kinetic Shields & Dreadnought Bosses |
| [cybersurge.html](cybersurge.html) | Cyber Surge — 360° vector matrix arena shooter with plasma surges, EMP shockwaves & Surge Singularity Bosses |
| [cyberoverdrive.html](cyberoverdrive.html) | Cyber Overdrive — High-octane matrix arena shooter & reflex dodger with plasma cannons, EMP shockwaves & Dreadnought Boss cores |
| [cybervortex.html](cybervortex.html) | Cyber Vortex — Orbital quantum core shooter with plasma beams, EMP vortex novas & Singularity Bosses |
| [cyberpulse.html](cyberpulse.html) | Cyber Pulse — High-voltage matrix wave shooter with plasma pulse beams & Titan Pulse Bosses |
| [cybermatrix.html](cybermatrix.html) | Cyber Matrix — High-octane phase-shifting quantum arena with dual-color laser bolts & Matrix Overlord Bosses |
| [cybercircuit.html](cybercircuit.html) | Cyber Circuit — High-voltage matrix pulse routing & node overload arcade game |
| [cybernexus.html](cybernexus.html) | Cyber Nexus — Orbital quantum grid defender & firewall breach shooter |
| [cyberstorm.html](cyberstorm.html) | Cyber Storm — High-octane orbital lightning matrix defense & tactical EMP pulse shooter |
| [cyberblade.html](cyberblade.html) | Cyber Blade — High-octane 360° cyber katana deflector & quantum blade slicer arena game |
| [cyberphantom.html](cyberphantom.html) | Cyber Phantom — High-octane 360° Quantum Stealth & Tactical Phase-Slicing Arena Fighter |
| [cyberstriker.html](cyberstriker.html) | Cyber Striker — High-octane space defense & dreadnought boss arcade shooter |
| [cyberhacker.html](cyberhacker.html) | Cyber Hacker — Retro terminal node hacking arcade game |
| [cyberracer.html](cyberracer.html) | CyberRacer — Retro digital superhighway racer |
| [cyberrunner.html](cyberrunner.html) | Cyber Runner — Fast-paced neon runner/dodger |
| [flappybird.html](flappybird.html) | Flappy Neon — Classic flap-and-dodge in neon style |
| [flappybyte.html](flappybyte.html) | Flappy Byte — Fly a data microchip through cyber columns |
| [frogger.html](frogger.html) | Neon Crossing — Classic Frogger-style crossing game |
| [neonsimon.html](neonsimon.html) | Neon Simon — Memory sequence game |
| [pacman.html](pacman.html) | Pac-Man — Classic maze chase game |
| [pong.html](pong.html) | Pong — Classic retro paddle-and-ball game |
| [snakegame.html](snakegame.html) | Snake Game — Classic snake arcade action |
| [sokoban.html](sokoban.html) | Sokoban — Classic block-pushing puzzle |
| [spaceinvaders.html](spaceinvaders.html) | Space Invaders — Classic arcade shooter |
| [tetris.html](tetris.html) | Tetris — Classic falling block puzzle game |
| [towerdefense.html](towerdefense.html) | Retro Tower Defense — Defend database cores against cyber viruses |
