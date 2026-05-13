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

  // Boost: raise sensed values to power to amplify strong signals vs noise
  const boost = CONFIG.TRAIL_STRENGTH;
  const l = Math.pow(left + 0.001, boost);
  const c = Math.pow(center + 0.001, boost);
  const r = Math.pow(right + 0.001, boost);

  const total = l + c + r;
  const noise = (Math.random() - 0.5) * CONFIG.ANT_WANDER;

  // If trails are too weak, random spin instead of going straight
  if (total < 0.001) {
    return (Math.random() - 0.5) * CONFIG.ANT_SPIN;
  }

  if (c >= l && c >= r) {
    return noise; // continue straight + small wander
  } else if (l >= r) {
    return -CONFIG.SENSOR_ANGLE * (l - r) / total + noise;
  } else {
    return CONFIG.SENSOR_ANGLE * (r - l) / total + noise;
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
  // Foraging ants (no food): follow food trails (blue), drop home trails (green)
  // Returning ants (hasFood): follow home trails (green), drop food trails (blue)
  //
  // Visual: green = "path to food" (blue trail dropped so others follow)
  //         blue = "path to nest" (green trail dropped so ant navigates home)
  const targetType = ant.hasFood ? 'home' : 'food';
  const dropType = ant.hasFood ? 'food' : 'home';

  // Decision
  const turn = decideDirection(ant, gridData, targetType);
  ant.angle += turn * 0.5; // scale turn rate (increased for more responsive turning)

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
