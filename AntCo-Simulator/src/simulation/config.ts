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
  ANT_COUNT: 100,
  ANT_SPEED: 2.5,
  ANT_SIZE: 4,
  ANT_WANDER: 0.3,

  // Sensors
  SENSOR_ANGLE: 0.5,
  SENSOR_DISTANCE: 8,

  // Pheromones
  EVAPORATION_RATE: 0.985,
  DROPOFF_RATE: 0.5,
  TRAIL_STRENGTH: 5,
  MIN_PHEROMONE: 0.001,
  MAX_PHEROMONE: 1.0,
  DIFFUSE_WEIGHT: 0.05, // Neighbor blur weight

  // Behavior
  NEST_RADIUS: 20,
  FOOD_RADIUS: 15,

  // Ticker
  LOGIC_UPDATES_PER_SECOND: 30,
};
