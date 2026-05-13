# Stack Setup and Best Practices

## Pixi.js v8 + Vite + TypeScript

### Project Setup
The project uses the standard Pixi.js Vite + TypeScript template. No additional configuration is needed for basic PixiJS usage.

### Important: Async Initialization
Wrap PixiJS initialization in an async IIFE. Top-level await has known issues with Vite production builds:

```typescript
// DO NOT use top-level await with PixiJS in Vite
(async() => {
  const app = new Application();
  await app.init({ resizeTo: window });
  document.body.appendChild(app.canvas);
  // ... rest of init
})();
```

### Core Imports (Pixi.js v8)
```typescript
import {
  Application,
  Assets,
  Container,
  Sprite,
  Graphics,
  Texture,
  Ticker,
  Rectangle,
  BitmapText
} from 'pixi.js';
```

### Asset Loading
```typescript
async function loadAssets() {
  const textures = await Assets.load([
    'assets/ant-sprite.png',
    'assets/nest.png',
    'assets/food.png'
  ]);
  return textures;
}
```

### Application Initialization
```typescript
const app = new Application();

await app.init({
  width: 1200,
  height: 800,
  background: '#1a1a2e',
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  // Performance options for low-end devices
  // useContextAlpha: false,  // Improves performance
  // antialias: false,        // Improves performance
});

document.body.appendChild(app.canvas);
```

### Game Loop
PixiJS uses `app.ticker` for frame updates:

```typescript
app.ticker.add((ticker) => {
  // ticker.deltaTime accounts for variable frame rates
  updateSimulation(ticker.deltaTime);
});
```

### Best Practices
1. Use `Assets` for texture loading - handles caching and batch loading
2. Call `texture.destroy()` when no longer needed to free memory
3. When destroying multiple textures, stagger destruction to prevent UI freezing
4. Group identical object types together for optimal batching
5. Set `interactiveChildren = false` on containers with no interactive descendants

## Common Pitfalls
- **Top-level await** fails in production builds with Vite
- Don't create/destroy sprites every frame - use object pooling
- Avoid per-frame modifications to `Graphics` objects
- Don't mix sprite and graphics draw order - breaks batching
- Text renders slowly - use `BitmapText` for dynamic text
