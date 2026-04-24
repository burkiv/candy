import type { Lane } from '../types';
import { LANE_POSITIONS } from './constants';

let obstacleCounter = 0;
let collectibleCounter = 0;

export function clampLane(lane: number): Lane {
  if (lane < 0) {
    return lane <= -1 ? -1 : 0;
  }

  if (lane > 0) {
    return lane >= 1 ? 1 : 0;
  }

  return 0;
}

export function laneCenter(lanes: Lane[]): number {
  const total = lanes.reduce((sum, lane) => sum + LANE_POSITIONS[lane], 0);
  return total / lanes.length;
}

export function obstacleWidth(lanes: Lane[]): number {
  if (lanes.length === 1) {
    return 2.2;
  }

  return Math.abs(LANE_POSITIONS[lanes[0]] - LANE_POSITIONS[lanes[1]]) + 2.2;
}

export function nextObstacleId(): string {
  obstacleCounter += 1;
  return `obstacle-${obstacleCounter}`;
}

export function nextCollectibleId(): string {
  collectibleCounter += 1;
  return `collectible-${collectibleCounter}`;
}

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function formatTime(value: number): string {
  return value.toFixed(1);
}
