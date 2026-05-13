import { CONFIG } from './config';
import * as grid from './grid';
import type { Grid } from './grid';

export interface Ant {
  x: number;
  y: number;
  angle: number;
  hasFood: boolean;
  speed: number;
  wanderAngle: number;
}

export function createAnt(nestX: number, nestY: number): Ant {
  return {
    x: nestX,
    y: nestY,
    angle: Math.random() * Math.PI * 2,
    hasFood: false,
    speed: CONFIG.ANT_SPEED,
    wanderAngle: Math.random() * Math.PI * 2,
  };
}

function getSensorAngle(ant: Ant, sensorAngle: number): number {
  return ant.angle + sensorAngle;
}

function getSensorPosition(ant: Ant, sensorAngle: number): [number, number] {
  const a = getSensorAngle(ant, sensorAngle);
  return [
    ant.x + Math.cos(a) * CONFIG.SENSOR_DISTANCE,
    ant.y + Math.sin(a) * CONFIG.SENSOR_DISTANCE,
  ];
}

function sensePheromone(
  ant: Ant,
  sensorAngle: number,
  gridData: Grid,
  type: 'home' | 'food'
): number {
  const [sx, sy] = getSensorPosition(ant, sensorAngle);
  return grid.sample(gridData, sx, sy, type);
}

function decideDirection(ant: Ant, gridData: Grid, type: 'home' | 'food'): number {
  const left = sensePheromone(ant, -CONFIG.SENSOR_ANGLE, gridData, type);
  const center = sensePheromone(ant, 0, gridData, type);
  const right = sensePheromone(ant, CONFIG.SENSOR_ANGLE, gridData, type);

  // Amplify: raise to power to make strong signals dominant
  const boost = CONFIG.TRAIL_STRENGTH;
  const l = Math.pow(Math.max(left, 0.0001), boost);
  const c = Math.pow(Math.max(center, 0.0001), boost);
  const r = Math.pow(Math.max(right, 0.0001), boost);

  const total = l + c + r;
  const noise = (Math.random() - 0.5) * CONFIG.ANT_WANDER;

  // If no significant trail detected, random walk
  if (total < 0.01) {
    return (Math.random() - 0.5) * CONFIG.ANT_SPIN * 2;
  }

  // Strongest sensor wins — turn toward it proportionally
  if (l >= c && l >= r) {
    return -0.6 + noise;       // Strong left turn
  } else if (r >= c && r >= l) {
    return 0.6 + noise;        // Strong right turn
  } else {
    return noise * 0.5;        // Continue mostly straight
  }
}

export function updateAnt(
  ant: Ant,
  gridData: Grid,
  nestX: number,
  nestY: number,
  foodX: number,
  foodY: number,
  deltaTime: number
): void {
  // ── SIGHT: direct navigation when close to objective ──
  if (!ant.hasFood) {
    const dx = ant.x - foodX;
    const dy = ant.y - foodY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONFIG.SIGHT_RADIUS_FORAGING) {
      // Can see food — steer directly toward it
      ant.angle = Math.atan2(foodY - ant.y, foodX - ant.x) + (Math.random() - 0.5) * 0.1;
      // Move
      const moveX = Math.cos(ant.angle) * ant.speed * deltaTime;
      const moveY = Math.sin(ant.angle) * ant.speed * deltaTime;
      ant.x += moveX;
      ant.y += moveY;
      grid.deposit(gridData, ant.x - moveX * 2, ant.y - moveY * 2, 'home', CONFIG.DROPOFF_RATE_FORAGING);

      // Pickup food on contact
      if (dx * dx + dy * dy < CONFIG.FOOD_RADIUS * CONFIG.FOOD_RADIUS) {
        ant.hasFood = true;
        ant.angle += Math.PI + (Math.random() - 0.5) * 0.5;
      }
      return; // skip trail logic this frame
    }
  } else {
    const dx = ant.x - nestX;
    const dy = ant.y - nestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONFIG.SIGHT_RADIUS_RETURNING) {
      // Can see nest — steer directly toward it
      ant.angle = Math.atan2(nestY - ant.y, nestX - ant.x) + (Math.random() - 0.5) * 0.1;
      // Move
      const moveX = Math.cos(ant.angle) * ant.speed * deltaTime;
      const moveY = Math.sin(ant.angle) * ant.speed * deltaTime;
      ant.x += moveX;
      ant.y += moveY;
      grid.deposit(gridData, ant.x - moveX * 2, ant.y - moveY * 2, 'food', CONFIG.DROPOFF_RATE_RETURNING);

      // Drop food at nest
      if (dx * dx + dy * dy < CONFIG.NEST_RADIUS * CONFIG.NEST_RADIUS) {
        ant.hasFood = false;
        ant.angle += Math.PI + (Math.random() - 0.5) * 0.5;
      }
      return; // skip trail logic this frame
    }
  }

  // ── PHEROMONE TRAIL following ──
  // Foraging: follows food trails (blue), drops home trails (green)
  // Returning: follows home trails (green), drops food trails (blue)
  const targetType = ant.hasFood ? 'home' : 'food';
  const dropType = ant.hasFood ? 'food' : 'home';

  const turn = decideDirection(ant, gridData, targetType);
  ant.angle += turn * 0.8;

  // Move
  const moveX = Math.cos(ant.angle) * ant.speed * deltaTime;
  const moveY = Math.sin(ant.angle) * ant.speed * deltaTime;
  ant.x += moveX;
  ant.y += moveY;

  // Drop pheromone behind ant
  const dropAmount = ant.hasFood
    ? CONFIG.DROPOFF_RATE_RETURNING
    : CONFIG.DROPOFF_RATE_FORAGING;
  grid.deposit(
    gridData,
    ant.x - moveX * 2,
    ant.y - moveY * 2,
    dropType,
    dropAmount
  );

  // Check food/nest collision (fallback if sight didn't catch it)
  if (!ant.hasFood) {
    const dx = ant.x - foodX;
    const dy = ant.y - foodY;
    if (dx * dx + dy * dy < CONFIG.FOOD_RADIUS * CONFIG.FOOD_RADIUS) {
      ant.hasFood = true;
      ant.angle += Math.PI + (Math.random() - 0.5) * 0.5;
    }
  } else {
    const dx = ant.x - nestX;
    const dy = ant.y - nestY;
    if (dx * dx + dy * dy < CONFIG.NEST_RADIUS * CONFIG.NEST_RADIUS) {
      ant.hasFood = false;
      ant.angle += Math.PI + (Math.random() - 0.5) * 0.5;
    }
  }

  // Boundary wrapping
  const w = CONFIG.WIDTH;
  const h = CONFIG.HEIGHT;
  if (ant.x < 0) { ant.x += w; }
  if (ant.x >= w) { ant.x -= w; }
  if (ant.y < 0) { ant.y += h; }
  if (ant.y >= h) { ant.y -= h; }
}
