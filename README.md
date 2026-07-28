# Arcade Game Portal

A lightweight, framework-free browser arcade built using pure HTML, CSS, and vanilla JavaScript.

## 🎮 Live Arcade Site (GitHub Pages)
This repository is configured for **GitHub Pages**. `index.html` serves as the primary entry point to access all individual game pages.

### Available Games:
- 🐍 **[Snake Game](snakegame.html)** — Classic snake arcade action.
- 🎰 **[Bing Ball](bingball.html)** — Pachinko/Plinko style pin-drop game.
- 🧱 **[Breakout](breakout.html)** — Classic breakout brick-destroying arcade game.
- 👾 **[Space Invaders](spaceinvaders.html)** — Classic space invaders arcade shooter.
- 🧩 **[Tetris](tetris.html)** — Classic falling block puzzle game.
- 🐤 **[Flappy Neon](flappybird.html)** — Classic flap-and-dodge mechanics in neon cyber style.
- 🔢 **[2048](2048.html)** — Classic sliding tile puzzle game.

---

## 🚀 Setting Up GitHub Pages

To publish this project to GitHub Pages:

1. **Push changes to GitHub:**
   ```bash
   git add index.html snakegame.html bingball.html breakout.html spaceinvaders.html tetris.html flappybird.html 2048.html README.md
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