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
  EVAPORATION_RATE_HOME: 0.985,   // Green evaporates fast (less noise)
  EVAPORATION_RATE_FOOD: 0.997,    // Blue persists longer (navigation anchor)
  DROPOFF_RATE_FORAGING: 0.1,    // Enough to see exploration paths
  DROPOFF_RATE_RETURNING: 0.3,   // Strong trail for navigation
  TRAIL_STRENGTH: 6,              // Stronger amplification of trail signals
  MIN_PHEROMONE: 0.0,
  MAX_PHEROMONE: 1.0,
  DIFFUSE_WEIGHT: 0.02,          // Minimal diffusion — keep trails sharp

  // Behavior
  NEST_RADIUS: 30,
  FOOD_RADIUS: 25,

  // SIGHT
  SIGHT_RADIUS_FORAGING: 80,   // How far ants can "see" food
  SIGHT_RADIUS_RETURNING: 100, // How far ants can "see" nest (longer since they need to find it)
  
  // Ticker
  LOGIC_UPDATES_PER_SECOND: 30,
};
