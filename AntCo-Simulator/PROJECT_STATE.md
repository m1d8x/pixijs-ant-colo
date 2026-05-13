# Ant Colony Simulator — Current State

## Project Overview
Pixi.js v8 + Vite + TypeScript ant colony optimization simulation running at `http://localhost:8080`.

**Source:** https://github.com/m1d8x/pixijs-ant-colo

**Run:** `cd AntCo-Simulator && npm install && npm run dev`

---

## File Structure
```
AntCo-Simulator/src/
├── main.ts                      # PixiJS app init, layers setup, game loop
├── simulation/
│   ├── config.ts                # All tunable parameters in one place
│   ├── ant.ts                   # Ant state, sensors, behavior (sight + pheromone logic)
│   └── grid.ts                  # Pheromone grid: evaporation, diffusion, deposit, sample
├── rendering/
│   ├── layers.ts                # Layer container architecture (z-order)
│   ├── pheromone-viz.ts         # Canvas→Texture pheromone renderer
│   └── ant-renderer.ts          # Sprite pool with procedural ant texture
├── vite-env.d.ts                # Vite type declaration
```

---

## Simulation Architecture

### 1. Pheromone Grid (`grid.ts`)
- Two `Float32Array` buffers: `home` (green) + `food` (blue)
- `Uint8Array` for future obstacles (allocated, not yet used)
- **Grid resolution**: 256×144 cells at 5px per cell = 1280×720 canvas
- **Operations**:
  - `evaporate()`: per-frame decay with separate rates for home vs food
  - `diffuse()`: neighbor averaging (minimal: 0.01 weight to keep trails sharp)
  - `deposit()`: adds pheromone with **amplification** — existing pheromone boosts new deposits (`deposit * (1 + 0.5 * existing)`)
  - `sample()`: reads pheromone at pixel coordinates

### 2. Ant Agents (`ant.ts`)
**State per ant**: position (x, y), angle, hasFood, speed, wanderAngle

**Behavior loop** (checked every logic tick, 30 FPS):

1. **SIGHT CHECK** (first priority):
   - Foraging ant within ~80px of food → steer directly to food
   - Returning ant within ~100px of nest → steer directly to nest
   - Skips pheromone logic for that frame (more efficient)

2. **PHEROMONE TRAIL FOLLOWING** (fallback):
   - 3 sensors: left (-0.5 rad), center (0), right (+0.5 rad), 15px ahead
   - `TRAIL_STRENGTH = 4`: raise sensor readings to power 4 to amplify signal differences
   - If no significant signal (total < 0.01): random walk with `ANT_SPIN * 2`
   - Strongest sensor wins: ±0.6 rad turn toward it, scaled by 0.8

3. **STATE TRANSITIONS**:
   - Foraging + reaches food → `hasFood = true`, turn back
   - Returning + reaches nest → `hasFood = false`, turn back
   - Falls back to radius collision if sight check missed

**Pheromone semantics**:
| State | Follows | Drops | Color |
|-------|---------|-------|-------|
| Foraging (no food) | `food` (blue) | `home` (green) | Off-white sprite |
| Returning (has food) | `home` (green) | `food` (blue) | Orange-tinted sprite |

### 3. Game Loop (`main.ts`)
- **Async IIFE** init (no top-level await — Vite production pitfall)
- **Decoupled ticks**: logic at 30 FPS, rendering at ~60 FPS
- Each logic step:
  1. `grid.evaporate()` → `grid.diffuse()`
  2. Update all ants (`updateAnt()`)
  3. `pheromoneRenderer.update()` → `antRenderer.sync()`

**Canvas**: 1280×720, background `#0a0a1a`, antialias enabled

**Static elements**:
- **Nest**: orange/brown circle (30px radius) at x=384, y=360 (30% from left)
- **Food**: green circle (25px radius) at x=896, y=360 (70% from right)

---

## Rendering Pipeline

### Layer System (z-order, back to front)
1. `pheromoneLayer` — Canvas texture sprite (single draw call)
2. `nestLayer` — Static Graphics circles
3. `foodLayer` — Static Graphics circles
4. `antLayer` — 120 sprites sharing one texture (PixiJS auto-batches)
5. `uiLayer` — Reserved for future HUD

### Pheromone Renderer (`pheromone-viz.ts`)
- Offscreen canvas matching grid (1280×720)
- Per-frame: iterate grid cells → write RGB pixel data
- **Green channel** = home pheromone
- **Blue channel** = food pheromone
- **Alpha** = 200 if above threshold, 0 otherwise
- `Texture.from(canvas)` → `Sprite` → single batched draw call

### Ant Renderer (`ant-renderer.ts`)
- **Procedural texture**: 16×16 canvas drawn with 2D context (elliptical body + head)
- **Sprite pool**: 120 sprites created once, never destroyed/recreated
- **Per-frame sync**: update position, rotation, tint color
  - Foraging: `#f0ead6` (off-white)
  - Returning: `#dd8833` (warm orange)

---

## Configuration Parameters (`config.ts`)

### Canvas
| Param | Value | Notes |
|-------|-------|-------|
| WIDTH / HEIGHT | 1280 × 720 | |
| BACKGROUND | `#0a0a1a` | Dark blue-black |

### Grid
| Param | Value | Notes |
|-------|-------|-------|
| GRID_WIDTH / HEIGHT | 256 × 144 | Cells |
| CELL_SIZE | 5px | Each cell maps to 5×5 pixels |

### Ants
| Param | Value | Notes |
|-------|-------|-------|
| ANT_COUNT | 120 | |
| ANT_SPEED | 2.5 | Pixels per frame |
| ANT_SIZE | 4 | Visual scale |
| ANT_WANDER | 0.15 | Small per-frame angular noise |
| ANT_SPIN | 0.6 | Strong random turn when no trail |

### Sensors
| Param | Value | Notes |
|-------|-------|-------|
| SENSOR_ANGLE | 0.5 rad (~29°) | Sensor spread |
| SENSOR_DISTANCE | 15px | Lookahead distance |

### Pheromones
| Param | Value | Notes |
|-------|-------|-------|
| EVAPORATION_RATE_HOME | 0.999 | Per-frame decay |
| EVAPORATION_RATE_FOOD | 0.999 | Per-frame decay |
| DROPOFF_RATE_FORAGING | 0.06 | Light exploration trails |
| DROPOFF_RATE_RETURNING | 0.4 | Strong return trails (8× higher) |
| PHEROMONE_AMPLIFICATION | 0.5 | +50% stacking per existing unit |
| TRAIL_STRENGTH | 4 | Exponent for signal amplification |
| MIN_PHEROMONE | 0.0 | Floor value |
| MAX_PHEROMONE | 1.0 | Ceiling value |
| DIFFUSE_WEIGHT | 0.01 | Neighbor blur (minimal) |
| PHEROMONE_VIS_THRESHOLD | 0.02 | Render cutoff for cleaner look |

### Behavior
| Param | Value | Notes |
|-------|-------|-------|
| NEST_RADIUS | 30px | Collision + visual |
| FOOD_RADIUS | 25px | Collision + visual |

### Sight
| Param | Value | Notes |
|-------|-------|-------|
| SIGHT_RADIUS_FORAGING | 80px | Direct steering to food |
| SIGHT_RADIUS_RETURNING | 100px | Direct steering to nest |

### Ticker
| Param | Value | Notes |
|-------|-------|-------|
| LOGIC_UPDATES_PER_SECOND | 30 | Decoupled from render FPS |

---

## Design Decisions

### What Works Well
- **Asymmetric drop rates** (0.06 vs 0.4) — returning ants create strong trails, foraging barely contribute to background noise
- **Sight radius** — prevents ants from "flying past" their target; gives them direct navigation when close
- **Positive feedback amplification** — stacked pheromone gets stronger deposits, creating stable route formation
- **Float32Array grid** — minimal overhead, fast per-frame iteration
- **Canvas texture for pheromones** — single draw call regardless of grid size
- **Sprite pooling** — no per-frame GC pressure

### Performance Optimizations Already In Place
- No per-frame sprite creation/destruction
- Single texture shared by all ant sprites (auto-batched by PixiJS)
- Phased container additions for batch-friendly draw order
- `interactive = false` + `interactiveChildren = false` on all layers
- Grid uses flat typed arrays, not object-per-cell
- Decoupled logic/render (30 vs 60 FPS)
- Minimal diffusion (0.01 weight) to skip unnecessary computation

### What's Ready But Not Implemented Yet
- `obstacles` Uint8Array allocated in grid — just needs render + behavior hooks
- `uiLayer` container exists — ready for stats/controls
- `DIFFUSE_WEIGHT` configurable — can be increased for smoother trails
- Config is fully exported — all params tweakable in one file
- Layer system — add new layers without modifying existing code

---

## Key Algorithms

### Trail Following Decision
```
1. Sensor readings at left, center, right positions
2. pow(reading, TRAIL_STRENGTH) — amplify signal differences
3. If total signal too weak: random walk (ANT_SPIN * 2)
4. Strongest sensor wins: turn ±0.6 rad toward it
5. Add noise factor (ANT_WANDER)
6. Scale turn by 0.8, apply to ant angle
```

### Pheromone Deposit With Amplification
```
existing = grid[cell]
boosted = amount * (1 + 0.5 * existing)
grid[cell] = min(1.0, existing + boosted)
```

### Sight Detection
```
distance = sqrt((ant.x - target.x)² + (ant.y - target.y)²)
if distance < SIGHT_RADIUS:
    ant.angle = atan2(target.y - ant.y, target.x - ant.x) ± tiny_noise
    # Skip pheromone trail logic this frame
```
