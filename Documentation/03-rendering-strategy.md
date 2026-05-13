# Rendering Strategy - Pixi.js v8

## Overview
This document covers how to render the ant colony simulation efficiently using Pixi.js v8's WebGL rendering pipeline.

## Architecture Layers

The simulation has distinct visual layers that should be separated into different containers for optimal performance:

```
app.stage
├── pheromoneLayer (Graphics or Texture)
├── obstacleLayer (Static sprites)
├── nestLayer (Static sprite)
├── foodLayer (Static sprites)
├── antLayer (Container with ant sprites)
└── uiLayer (Text, buttons, etc.)
```

## Rendering Pheromone Grid

### Option 1: CanvasTexture (Recommended)
Update a single canvas texture with pheromone data:

```typescript
// Create offscreen canvas matching grid dimensions
const pheromoneCanvas = document.createElement('canvas');
pheromoneCanvas.width = gridWidth * cellSize;
pheromoneCanvas.height = gridHeight * cellSize;
const pheromoneCtx = pheromoneCanvas.getContext('2d')!;
const pheromoneImageData = pheromoneCtx.createImageData(
  pheromoneCanvas.width, pheromoneCanvas.height
);
const pheromoneData = pheromoneImageData.data;

// Create texture from canvas
const pheromoneTexture = PIXI.Texture.from(pheromoneCanvas);
const pheromoneSprite = new PIXI.Sprite(pheromoneTexture);
pheromoneLayer.addChild(pheromoneSprite);

// Update function - call per frame
function updatePheromoneTexture() {
  const data = pheromoneData;
  let idx = 0;
  
  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      const homeVal = homePheromones[gy * gridWidth + gx];
      const foodVal = foodPheromones[gy * gridWidth + gx];
      
      // Color: green for home, blue for food
      const r = 0;
      const g = Math.floor(homeVal * 255);
      const b = Math.floor(foodVal * 255);
      
      // Fill cellSize x cellSize area
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const pixelIdx = idx + (cy * pheromoneCanvas.width + cx) * 4;
          data[pixelIdx] = r;     // Red
          data[pixelIdx + 1] = g; // Green
          data[pixelIdx + 2] = b; // Blue
          data[pixelIdx + 3] = 255; // Alpha
        }
      }
      idx += cellSize * 4;
    }
  }
  
  pheromoneCtx.putImageData(pheromoneImageData, 0, 0);
  pheromoneTexture.source.update();
}
```

### Option 2: BitmapTexture for Large Grids
For very large grids (>500x500 cells), consider using WebGL directly via a custom shader.

## Rendering Ants

### Individual Sprites (Up to 500 ants)
```typescript
const antLayer = new PIXI.Container();
const antTexture = await PIXI.Assets.load('assets/ant.png');

function createAntSprite(texture: PIXI.Texture) {
  return new PIXI.Sprite(texture);
}

// In initialization:
const antSprites: PIXI.Sprite[] = [];
for (let i = 0; i < maxAnts; i++) {
  const sprite = createAntSprite(antTexture);
  sprite.anchor.set(0.5);
  antLayer.addChild(sprite);
  antSprites.push(sprite);
}
```

### Performance with Lots of Ants
PixiJS auto-batches sprites using the same texture. Key considerations:

- **Sprites are fastest** - prefer sprites over Graphics for dynamic objects
- **Auto-batching** - PixiJS automatically batches sprites with the same texture
- **Draw order** - keep ant sprites contiguous in the scene graph
- **No custom blend modes** on individual ants - breaks batching

### Ant Sprite Updates
```typescript
function updateAntSprites(ants: Ant[], sprites: PIXI.Sprite[]) {
  for (let i = 0; i < ants.length; i++) {
    const sprite = sprites[i];
    sprite.x = ants[i].x;
    sprite.y = ants[i].y;
    sprite.rotation = ants[i].angle;
    
    // Visual feedback for state
    sprite.tint = ants[i].hasFood ? 0xffaa00 : 0xffffff;
  }
}
```

## Static Objects (Nest, Food, Obstacles)

### Nest and Food
Load as static sprites - they don't change position:

```typescript
const nestTexture = await PIXI.Assets.load('assets/nest.png');
const nestSprite = new PIXI.Sprite(nestTexture);
nestSprite.anchor.set(0.5);
nestSprite.x = nestX;
nestSprite.y = nestY;
stage.addChild(nestSprite);
```

### Obstacles
Use Graphics for obstacles (they're typically added rarely):

```typescript
const obstacleGraphics = new PIXI.Graphics();
obstacleGraphics.rect(0, 0, canvas.width, canvas.height);
obstacleGraphics.fill({ color: 0x333333 });
stage.addChild(obstacleGraphics);
```

**Important:** Avoid modifying Graphics every frame. For static obstacles, create them once and leave them.

## Performance Checklist

### Must Do
- [ ] Use a single texture for all ant sprites
- [ ] Render pheromone grid as a single sprite texture
- [ ] Group identical object types together
- [ ] Use `antialias: false` on low-end devices
- [ ] Set `cullable = true` for objects that can go off-screen

### Avoid
- [ ] Creating/destroying sprites per frame
- [ ] Per-frame Graphics modifications
- [ ] Per-frame text rendering (use BitmapText)
- [ ] Mixing sprite/graphics draw order
- [ ] Using multiple textures for the same object type
- [ ] Filters on pheromone layer or ant layer

### Optimization Options (Pixi.js v8)
```typescript
await app.init({
  antialias: false,         // Disable for better performance
  useContextAlpha: false,   // Disable alpha compositing if not needed
  resolution: 1,            // Lower resolution for high-density displays
  // These are good defaults for simulation work
});
```

### Frame Rate Decoupling
Separate simulation logic from rendering:

```typescript
let lastLogicUpdate = 0;
const LOGIC_INTERVAL = 1000 / 30; // 30 FPS logic

app.ticker.add((ticker) => {
  const now = performance.now();
  if (now - lastLogicUpdate >= LOGIC_INTERVAL) {
    updateSimulation();
    updatePheromoneTexture();
    updateAntSprites(ants, antSprites);
    lastLogicUpdate = now;
  }
});
```

## Pixi.js v8 Specific Notes

### Application Initialization
- `app.init()` is async - must await before using
- `app.canvas` is the resulting canvas element
- `app.screen` provides width/height

### Asset Loading
- Use `Assets.load()` for textures
- `Assets` handles caching automatically
- `texture.destroy()` to free memory when done

### Container Management
- `Container.addChild()` / `removeChild()` for dynamic objects
- `container.visible = false` to hide without removing
- `container.alpha` for transparency (affects batching)

### Ticker
- `app.ticker.add()` registers frame update callbacks
- `ticker.deltaTime` accounts for variable frame rate
- Multiple tickers can be registered (called in order)

## References
- [Pixi.js v8 Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [Rendering 50,000 Sprites at 60 FPS](https://javascript.plainenglish.io/i-rendered-50-000-sprites-at-60-fps-and-you-can-too-91acd1e18c44)
