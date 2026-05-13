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

  const pow = (v: number) => Math.pow(v + 0.001, CONFIG.TRAIL_STRENGTH);
  const l = pow(left);
  const c = pow(center);
  const r = pow(right);

  const total = l + c + r + 0.0001;
  const rand = (Math.random() - 0.5) * CONFIG.ANT_WANDER;

  if (c >= l && c >= r) {
    return rand; // continue straight
  } else if (l >= r) {
    return -CONFIG.SENSOR_ANGLE * (c + r) / total + rand;
  } else {
    return CONFIG.SENSOR_ANGLE * (c + l) / total + rand;
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
  // Determine target pheromone (what to follow) and drop pheromone (what to leave)
  const targetType = ant.hasFood ? 'home' : 'food';
  const dropType = ant.hasFood ? 'food' : 'home';

  // Decision
  const turn = decideDirection(ant, gridData, targetType);
  ant.angle += turn * 0.3; // scale turn rate

  // Move
  const moveX = Math.cos(ant.angle) * ant.speed * deltaTime;
  const moveY = Math.sin(ant.angle) * ant.speed * deltaTime;
  ant.x += moveX;
  ant.y += moveY;

  // Drop pheromone behind ant
  grid.deposit(
    gridData,
    ant.x - moveX * 2,
    ant.y - moveY * 2,
    dropType,
    CONFIG.DROPOFF_RATE
  );

  // Check food/nest collision
  if (!ant.hasFood) {
    const dx = ant.x - foodX;
    const dy = ant.y - foodY;
    if (dx * dx + dy * dy < CONFIG.FOOD_RADIUS * CONFIG.FOOD_RADIUS) {
      ant.hasFood = true;
      ant.angle += Math.PI; // turn around
      // Add some random deviation
      ant.angle += (Math.random() - 0.5) * 0.5;
    }
  } else {
    const dx = ant.x - nestX;
    const dy = ant.y - nestY;
    if (dx * dx + dy * dy < CONFIG.NEST_RADIUS * CONFIG.NEST_RADIUS) {
      ant.hasFood = false;
      ant.angle += Math.PI;
      ant.angle += (Math.random() - 0.5) * 0.5;
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
