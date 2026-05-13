import { CONFIG } from './config';

export interface Grid {
  home: Float32Array;
  food: Float32Array;
  obstacles: Uint8Array;
  width: number;
  height: number;
}

export function createGrid(): Grid {
  const size = CONFIG.GRID_WIDTH * CONFIG.GRID_HEIGHT;
  return {
    home: new Float32Array(size),
    food: new Float32Array(size),
    obstacles: new Uint8Array(size),
    width: CONFIG.GRID_WIDTH,
    height: CONFIG.GRID_HEIGHT,
  };
}

export function index(grid: Grid, gx: number, gy: number): number {
  return gy * grid.width + gx;
}

export function evaporate(grid: Grid): void {
  for (let i = 0; i < grid.home.length; i++) {
    // Green (home) evaporates fast — it's noise from wandering ants
    grid.home[i] *= CONFIG.EVAPORATION_RATE_HOME;
    if (grid.home[i] < CONFIG.MIN_PHEROMONE) grid.home[i] = CONFIG.MIN_PHEROMONE;

    // Blue (food) persists longer — it's the navigation anchor
    grid.food[i] *= CONFIG.EVAPORATION_RATE_FOOD;
    if (grid.food[i] < CONFIG.MIN_PHEROMONE) grid.food[i] = CONFIG.MIN_PHEROMONE;
  }
}

export function diffuse(grid: Grid): void {
  const w = CONFIG.DIFFUSE_WEIGHT;
  const { home, food, width, height } = grid;

  // Diffuse home pheromones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      home[idx] =
        home[idx] * (1 - 4 * w) +
        (home[idx - 1] + home[idx + 1] + home[idx - width] + home[idx + width]) * w;
    }
  }
  // Diffuse food pheromones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      food[idx] =
        food[idx] * (1 - 4 * w) +
        (food[idx - 1] + food[idx + 1] + food[idx - width] + food[idx + width]) * w;
    }
  }
}

export function deposit(
  grid: Grid,
  px: number,
  py: number,
  type: 'home' | 'food',
  amount: number
): void {
  const gx = Math.floor(px / CONFIG.CELL_SIZE);
  const gy = Math.floor(py / CONFIG.CELL_SIZE);
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return;
  const idx = index(grid, gx, gy);
  const buffer = type === 'home' ? grid.home : grid.food;

  // Amplify: if cell already has pheromone of same type, existing level boosts new deposit
  // This creates positive feedback: stronger trails attract more ants → stronger trails
  const existing = buffer[idx];
  const boosted = amount * (1 + CONFIG.PHEROMONE_AMPLIFICATION * existing);
  buffer[idx] = Math.min(CONFIG.MAX_PHEROMONE, existing + boosted);
}

export function sample(
  grid: Grid,
  px: number,
  py: number,
  type: 'home' | 'food'
): number {
  const gx = Math.floor(px / CONFIG.CELL_SIZE);
  const gy = Math.floor(py / CONFIG.CELL_SIZE);
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0;
  const idx = index(grid, gx, gy);
  return type === 'home' ? grid.home[idx] : grid.food[idx];
}
