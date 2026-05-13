# Ant Colony Simulation Algorithm

## Overview
Ant Colony Optimization (ACO) simulates the emergent behavior of ant colonies. Individual ants follow simple local rules, but the colony self-organizes to find optimal paths between nest and food sources.

## Core Components

### 1. Pheromone Grid
The environment is modeled as a 2D grid where each cell tracks pheromone concentrations.

**Pheromone Types:**
- `homePheromone` (green trail) - deposited by ants returning to nest, helps food-seeking ants navigate home
- `foodPheromone` (blue trail) - deposited by ants searching for food, helps returning ants find the path back

**Grid Cell Structure:**
```typescript
interface Cell {
  x: number;
  y: number;
  homePheromone: number;  // 0.0 to 1.0
  foodPheromone: number;  // 0.0 to 1.0
  obstacle: boolean;
}
```

**Performance Note:** Use `Float32Array` for raw performance:
```typescript
const gridWidth = 200;
const gridHeight = 150;
const homePheromones = new Float32Array(gridWidth * gridHeight);
const foodPheromones = new Float32Array(gridWidth * gridHeight);
```

### 2. Pheromone Evaporation
Pheromones decay each frame to prevent stale trails from dominating behavior.

```typescript
// Evaporation rate (0.95 to 0.99 per frame)
const EVAPORATION_RATE = 0.99;
const MIN_PHEROMONE = 0.001;
const MAX_PHEROMONE = 1.0;

function stepPheromones() {
  for (let i = 0; i < homePheromones.length; i++) {
    homePheromones[i] *= EVAPORATION_RATE;
    homePheromones[i] = Math.max(MIN_PHEROMONE, Math.min(MAX_PHEROMONE, homePheromones[i]));
    
    foodPheromones[i] *= EVAPORATION_RATE;
    foodPheromones[i] = Math.max(MIN_PHEROMONE, Math.min(MAX_PHEROMONE, foodPheromones[i]));
  }
}
```

### 3. Ant Agent
Each ant is an independent agent with state and local sensing.

**Ant State:**
```typescript
interface Ant {
  x: number;
  y: number;
  angle: number;           // Movement direction (radians)
  hasFood: boolean;        // true = returning to nest
  speed: number;
  wanderAngle: number;     // Random deviation from current path
}
```

### 4. Ant Movement Logic

**Sensory System:**
Each ant has 3 sensors (left, center, right) to detect pheromone gradients ahead.

```typescript
interface Sensor {
  x: number;  // Relative offset
  y: number;
  angle: number;  // Angle relative to ant's heading
}

const SENSORS = [
  { angle: -0.5, distance: 10 },  // Left sensor
  { angle: 0, distance: 10 },     // Center sensor
  { angle: 0.5, distance: 10 },   // Right sensor
];
```

**Decision Logic:**
1. Sample pheromone values at each sensor position
2. Weight each direction by pheromone concentration
3. Add random noise to prevent getting stuck in loops
4. Turn toward the strongest signal

```typescript
function decideDirection(ant: Ant, targetPheromone: Float32Array): number {
  // Sample left, center, right
  const leftPheromone = getPheromoneAtSensor(ant, -0.5, targetPheromone);
  const centerPheromone = getPheromoneAtSensor(ant, 0, targetPheromone);
  const rightPheromone = getPheromoneAtSensor(ant, 0.5, targetPheromone);
  
  // Add randomness
  const randomFactor = (Math.random() - 0.5) * 0.2;
  
  // Determine turn direction
  if (centerPheromone > leftPheromone && centerPheromone > rightPheromone) {
    return randomFactor;  // Continue straight
  } else if (leftPheromone > rightPheromone) {
    return -0.2 + randomFactor;  // Turn left
  } else if (rightPheromone > leftPheromone) {
    return 0.2 + randomFactor;   // Turn right
  }
  
  // Random wandering when no pheromones detected
  return (Math.random() - 0.5) * 0.5;
}
```

**Trail Strength Parameter:**
Controls how strongly ants follow pheromone trails vs random exploration.

```typescript
const TRAIL_STRENGTH = 5;  // Range: 1-10+
// Higher values = stronger pheromone following
// Lower values = more random exploration
// Weight calculation: pow(pheromoneLevel, TRAIL_STRENGTH)
```

### 5. Ant Behavior States

**Foraging State:**
- Ant leaves nest and wanders randomly
- Follows foodPheromone if detected
- Looking for food source
- Drops homePheromone behind it (so it can find its way back)

**Returning State:**
- Ant has found food and needs to return to nest
- Follows homePheromone trail back to nest
- Drops foodPheromone behind it (so other ants can follow to food)
- When reaching nest, resets to foraging state

**State Transition Pseudocode:**
```typescript
function updateAnt(ant: Ant, deltaTime: number) {
  // Determine which pheromone to follow
  const targetPheromone = ant.hasFood ? homePheromones : foodPheromones;
  const dropPheromone = ant.hasFood ? foodPheromones : homePheromones;
  
  // Decide direction based on pheromone sensing
  const turn = decideDirection(ant, targetPheromone);
  ant.angle += turn;
  
  // Move ant
  ant.x += Math.cos(ant.angle) * ant.speed * deltaTime;
  ant.y += Math.sin(ant.angle) * ant.speed * deltaTime;
  
  // Drop pheromones
  const gridX = Math.floor(ant.x / CELL_SIZE);
  const gridY = Math.floor(ant.y / CELL_SIZE);
  const index = gridY * gridWidth + gridX;
  dropPheromone[index] = Math.min(MAX_PHEROMONE, dropPheromone[index] + DROPOFF_RATE);
  
  // Check for food/nest collision
  if (!ant.hasFood && isOnFood(ant)) {
    ant.hasFood = true;
    ant.angle += Math.PI;  // Turn around
  }
  
  if (ant.hasFood && isOnNest(ant)) {
    ant.hasFood = false;
    ant.angle += Math.PI;  // Turn around
  }
  
  // Keep ant within bounds
  ant.x = wrap(ant.x, canvas.width);
  ant.y = wrap(ant.y, canvas.height);
}
```

### 6. Path Finding Enhancement
When obstacles are introduced or food sources are depleted:

1. Ants revert to random exploration when pheromone signals are weak
2. New trails gradually form around obstacles
3. System dynamically adapts to environmental changes

## Configuration Parameters

```typescript
// Grid
const CELL_SIZE = 10;           // Size of each grid cell in pixels
const GRID_WIDTH = 200;         // Number of cells horizontally
const GRID_HEIGHT = 150;        // Number of cells vertically

// Simulation
const MAX_ANTS = 100;           // Starting ant count
const ANT_SPEED = 2;            // Pixels per frame
const SENSOR_ANGLE = 0.5;       // Radians for sensor angle
const SENSOR_DIST = 10;         // Pixels in front of ant

// Pheromones
const EVAPORATION_RATE = 0.99;  // Decay per frame
const DROPOFF_RATE = 0.5;       // Amount deposited per step
const TRAIL_STRENGTH = 5;       // Pheromone weight exponent
const MIN_PHEROMONE = 0.001;    // Minimum threshold
const MAX_PHEROMONE = 1.0;      // Maximum concentration

// Rendering
const LOGIC_UPDATES_PER_SECOND = 30;  // Decouple from 60fps render
```

## References
- [Ant Colony Optimization (Wikipedia)](https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms)
- [p5.js Ant Colony Tutorial](https://happycoding.io/tutorials/p5js/creating-classes/ant-colony)
- [Coding Adventure: Ant and Slime Simulations (YouTube)](https://www.youtube.com/watch?v=X-iSQQgOd1A)
- [Softology Ant Colony Simulations](https://softologyblog.wordpress.com/2020/03/21/ant-colony-simulations/)
