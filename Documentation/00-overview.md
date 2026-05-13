# Ant Colony Simulator - Project Overview

## Project Stack
- **Renderer:** Pixi.js v8
- **Build Tool:** Vite
- **Language:** TypeScript
- **Package Manager:** npm (inferred from package.json)

## Tech Stack Notes
- Pixi.js v8 provides WebGL-accelerated 2D rendering
- Types are bundled with pixi.js v8 (no @types needed)
- Top-level await has known issues with Vite production builds - wrap PixiJS init in async IIFE
- Vite provides fast HMR during development

## Project Structure

```
AntCo-Simulator/
├── src/
│   └── main.ts        # Entry point
│   └── vite-env.d.ts  # Vite type declarations
├── public/
│   ├── assets/        # Static assets (spritesheets, images)
│   ├── style.css      # Global styles
│   └── favicon.png    # Favicon
├── index.html         # HTML entry point
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
├── eslint.config.mjs  # ESLint configuration
├── package.json       # Dependencies and scripts
└── Documentation/     # This folder - development guides
```

## Key References
- [Pixi.js v8 Quick Start](https://pixijs.com/8.x/guides/getting-started/quick-start)
- [Pixi.js v8 Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [Ant Colony Optimization (Wikipedia)](https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms)
