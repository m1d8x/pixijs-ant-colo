# Performance Guide and Pitfalls

## Summary
This document covers critical performance considerations for the ant colony simulation, drawn from Pixi.js v8 performance best practices and ant colony simulation patterns.

## Performance Targets

| Ant Count | Target FPS | Notes |
|-----------|-----------|-------|
| 100 | 60 FPS trivial | Auto-batched by default |
| 500 | 60 FPS | Single texture, grouped sprites |
| 1000 | 60 FPS | Requires optimized pheromone rendering |
| 5000 | 30-60 FPS | May need Float32Array grid + canvas texture |

## Critical Pitfalls

### 1. Don't Create/Destroy Sprites Per Frame
**Bad:**
```typescript
// Creates garbage and forces GC
app.ticker.add(() => {
  // Bad: creating sprites every frame
  const antSprite = new PIXI.Sprite(antTexture);
  antSprite.x = ant.x;
  antLayer.addChild(antSprite);
});
```

**Good:**
```typescript
// Create sprites once, update properties
const antSprites = Array.from({ length: maxAnts }, () => {
  const sprite = new PIXI.Sprite(antTexture);
  sprite.anchor.set(0.5);
  antLayer.addChild(sprite);
  return sprite;
});

app.ticker.add(() => {
  // Just update position/rotation
  for (let i = 0; i < ants.length; i++) {
    antSprites[i].x = ants[i].x;
    antSprites[i].y = ants[i].y;
    antSprites[i].rotation = ants[i].angle;
  }
});
```

### 2. Don't Render Grid Cells Individually
**Bad:**
```typescript
// Terrible: N draw calls where N = grid cells
for (let gy = 0; gy < gridHeight; gy++) {
  for (let gx = 0; gx < gridWidth; gx++) {
    const cell = new PIXI.Graphics();
    cell.rect(x, y, cellSize, cellSize);
    cell.fill(color);
    pheromoneLayer.addChild(cell);
  }
}
```

**Good:**
```typescript
// Single draw call: render to canvas, update texture once
const pheromoneTexture = PIXI.Texture.from(pheromoneCanvas);
const pheromoneSprite = new PIXI.Sprite(pheromoneTexture);
pheromoneLayer.addChild(pheromoneSprite);

// Update the canvas pixel data, call texture.source.update()
updatePheromoneTexture();
```

### 3. Don't Modify Graphics Every Frame
**Bad:**
```typescript
// Causes graphics buffer rebuild every frame
app.ticker.add(() => {
  graphics.clear();
  graphics.rect(0, 0, w, h);
  graphics.fill(color);
});
```

**Good:**
```typescript
// Create graphics once, leave it static
const graphics = new PIXI.Graphics();
graphics.rect(0, 0, w, h);
graphics.fill(color);
pheromoneLayer.addChild(graphics);
// Never modify - use canvas texture approach instead
```

### 4. Don't Use Top-Level Await with PixiJS + Vite
**Bad:**
```typescript
import { Application } from 'pixi.js';

const app = new Application();
await app.init({ resizeTo: window }); // Breaks in production build
```

**Good:**
```typescript
import { Application } from 'pixi.js';

(async() => {
  const app = new Application();
  await app.init({ resizeTo: window });
  // Rest of initialization
})();
```

Known issue with Vite ≤ 6.0.6.

### 5. Maintain Draw Order for Batching
PixiJS groups identical object types for batched WebGL draw calls.

**Bad (breaks batching):**
```
sprite -> graphics -> sprite -> graphics
```
4 draw calls (worst case)

**Good (optimal batching):**
```
sprite -> sprite -> graphics -> graphics
```
2 draw calls

```typescript
const stage = app.stage;
// Add all sprites first
antsLayer.forEach(sprite => stage.addChild(sprite));
// Then all graphics
stage.addChild(pheromoneGraphics);
stage.addChild(nestSprite);
```

### 6. Avoid Per-Frame Text Rendering
**Bad:**
```typescript
app.ticker.add(() => {
  // Expensive: canvas draw + GPU upload every frame
  text.text = `Ants: ${count}`;
});
```

**Good:**
```typescript
// Use BitmapText for dynamic text
const statsText = new PIXI.BitmapText({
  text: 'Ants: 0',
  style: { fontSize: 16, fill: '#ffffff' }
});
app.ticker.add(() => {
  statsText.text = `Ants: ${count}`;
});
```

### 7. Pheromone Grid Performance
Use `Float32Array` instead of object arrays:

**Bad:**
```typescript
// Object per cell - heavy memory usage
const grid: Cell[][] = [];
for (let y = 0; y < height; y++) {
  grid[y] = [];
  for (let x = 0; x < width; x++) {
    grid[y][x] = { home: 0, food: 0, obstacle: false };
  }
}
```

**Good:**
```typescript
// Flat Float32Array - minimal memory overhead
const homePheromones = new Float32Array(width * height);
const foodPheromones = new Float32Array(width * height);
const obstacles = new Uint8Array(width * height);

// Access: index = y * width + x
homePheromones[gy * gridWidth + gx] = 0.5;
```

### 8. Clamp Pheromone Values
Without clamping, precision issues can cause overflow or underflow:

```typescript
function stepPheromones() {
  for (let i = 0; i < homePheromones.length; i++) {
    homePheromones[i] *= EVAPORATION;
    // Clamp to prevent precision issues
    if (homePheromones[i] < MIN_PHEROMONE) {
      homePheromones[i] = MIN_PHEROMONE;
    }
    if (homePheromones[i] > MAX_PHEROMONE) {
      homePheromones[i] = MAX_PHEROMONE;
    }
  }
}
```

### 9. Texture Management
- **Use spritesheets** to minimize texture count
- **Stagger destruction** - when destroying many textures, space them out:
```typescript
// Bad: destroys all at once, causes frame stutter
textures.forEach(t => t.destroy());

// Good: stagger destruction
let idx = 0;
function destroyTextures() {
  if (idx < textures.length) {
    textures[idx].destroy();
    idx++;
    setTimeout(destroyTextures, Math.random() * 50);
  }
}
destroyTextures();
```

### 10. Grid Resolution Trade-offs
Higher grid resolution = more accurate trails but slower performance:

| Grid Size | Cell Size | Performance | Trail Quality |
|-----------|-----------|-------------|---------------|
| 100x75    | 20px      | Very fast   | Blocky        |
| 200x150   | 10px      | Fast        | Good          |
| 400x300   | 5px       | Moderate    | Excellent     |
| 800x600   | 2.5px     | Slow        | Perfect       |

**Recommendation:** Start with 200x150 at 10px cells, adjust based on performance.

## Configuration for Different Targets

### Desktop / High-end
```typescript
await app.init({
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  background: '#1a1a2e',
});
```

### Low-end / Mobile
```typescript
await app.init({
  antialias: false,
  useContextAlpha: false,
  resolution: 1,
  background: '#1a1a2e',
});
```

## Monitoring Performance

```typescript
// Add FPS counter to UI
const fpsCounter = new PIXI.BitmapText({ text: 'FPS: 60', style });
const frameCount = { count: 0, lastTime: performance.now() };

app.ticker.add(() => {
  frameCount.count++;
  const now = performance.now();
  if (now - frameCount.lastTime >= 1000) {
    fpsCounter.text = `FPS: ${frameCount.count}`;
    frameCount.count = 0;
    frameCount.lastTime = now;
  }
});
```

## Checklist for Implementation

- [ ] Wrap PixiJS init in async IIFE
- [ ] Pre-create all sprites (no per-frame creation)
- [ ] Single texture for all ants
- [ ] Pheromone grid rendered as canvas texture
- [ ] Use Float32Array for grid data
- [ ] Clamp pheromone values
- [ ] Decouple logic from render frame rate
- [ ] Group objects by type for batching
- [ ] Avoid per-frame Graphics modifications
- [ ] Use BitmapText for dynamic UI
- [ ] Add FPS monitoring

## References
- [Pixi.js v8 Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [Pixi.js Optimization Deep Dive](https://cprimozic.net/notes/posts/pixi-js-optimizations/)
- [Large Sprites Performance (GitHub Issue)](https://github.com/pixijs/pixijs/issues/5246)
