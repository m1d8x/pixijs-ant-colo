export const CONFIG = {
  // Canvas
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND: '#0a0a1a',

  // Grid
  GRID_WIDTH: 256,
  GRID_HEIGHT: 144,
  CELL_SIZE: 5,

  // Ants
  ANT_COUNT: 150,
  ANT_SPEED: 2.5,
  ANT_SIZE: 4,
  ANT_WANDER: 0.15,           // Per-frame angular noise (radians)
  ANT_SPIN: 0.45,             // Extra random spin when no trail detected

  // Sensors
  SENSOR_ANGLE: 0.5,
  SENSOR_DISTANCE: 12,        // Increased from 8 for better lookahead

  // Pheromones
  EVAPORATION_RATE: 0.994,    // Slightly slower evaporation for visible trails
  DROPOFF_RATE: 0.8,           // Higher for faster trail formation
  TRAIL_STRENGTH: 5,           // Pheromone weight exponent
  MIN_PHEROMONE: 0.0,          // Zero - no noise floor, trails appear on demand
  MAX_PHEROMONE: 1.0,
  DIFFUSE_WEIGHT: 0.08,        // Slightly more smoothing

  // Behavior
  NEST_RADIUS: 25,
  FOOD_RADIUS: 20,

  // Ticker
  LOGIC_UPDATES_PER_SECOND: 30,
};
