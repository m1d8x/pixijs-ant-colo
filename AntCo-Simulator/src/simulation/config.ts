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
  ANT_COUNT: 120,
  ANT_SPEED: 2.5,
  ANT_SIZE: 4,
  ANT_WANDER: 0.15,
  ANT_SPIN: 0.6,

  // Sensors
  SENSOR_ANGLE: 0.5,
  SENSOR_DISTANCE: 15,

  // Pheromones
  EVAPORATION_RATE: 0.995,
  DROPOFF_RATE_FORAGING: 0.08,  // Enough to see exploration paths
  DROPOFF_RATE_RETURNING: 0.4,  // Strong trail for navigation
  TRAIL_STRENGTH: 5,
  MIN_PHEROMONE: 0.0,
  MAX_PHEROMONE: 1.0,
  DIFFUSE_WEIGHT: 0.06,

  // Behavior
  NEST_RADIUS: 30,
  FOOD_RADIUS: 25,

  // Ticker
  LOGIC_UPDATES_PER_SECOND: 30,
};
