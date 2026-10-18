// Carom — a top-down paddle duel with spin and bank-shot obstacles.
import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLE_HH,
  OBSTACLE_HW,
  OBSTACLE_SPIN_RATE,
  OBSTACLE_SWAY_AMP,
  OBSTACLE_SWAY_PERIOD,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_H,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PADDLE_W,
  MATCHOVER_ITEMS,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";

export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: {
    readonly left: PaddleState;
    readonly right: PaddleState;
  };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
}

export interface CaromSnapshot {
  version: number;
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";
  score: { p1: number; p2: number };
  winner: Side | null;
  muted: boolean;
  paddles: {
    left: { cy: number; vy: number; drivenVy: number; driven: boolean };
    right: { cy: number; vy: number; drivenVy: number; driven: boolean };
  };
  ai: { tracking: boolean; movement: boolean };
  receiver: Side;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    spin: number;
    held: boolean;
    holdTimer: number;
    serveSign: 1 | -1;
    trail: { x: number; y: number; t: number }[];
  } | null;
  obstacles: { index: number; cx: number; cy: number; theta: number }[];
  obstacleClock: number;
  obstacleClockRunning: boolean;
  simTime: number;
}
export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaromDebugApi {
  version: number;
  clearWorld(state: DeepReadonly<CaromState>): CaromState;
  spawnBall(state: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(state: DeepReadonly<CaromState>, index: number): CaromState;
  reset(state: DeepReadonly<CaromState>): CaromState;
  reconcile(state: DeepReadonly<CaromState>): CaromState;
  setScreen(state: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(state: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    state: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(state: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(state: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(state: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(
    state: DeepReadonly<CaromState>,
    side: Side,
    cy: number,
  ): CaromState;
  setPaddleVy(
    state: DeepReadonly<CaromState>,
    side: Side,
    vy: number,
  ): CaromState;
  setPaddleDriven(
    state: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    state: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    state: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(state: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(state: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(
    state: DeepReadonly<CaromState>,
    seconds: number,
  ): CaromState;
  setBallServeSign(state: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(state: DeepReadonly<CaromState>): CaromState;
  setAiTracking(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(state: DeepReadonly<CaromState>, muted: boolean): CaromState;
  setObstacleClock(state: DeepReadonly<CaromState>, t: number): CaromState;
  setObstacleClockRunning(
    state: DeepReadonly<CaromState>,
    running: boolean,
  ): CaromState;
  snapshot(state: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(state: DeepReadonly<CaromState>, index: number): MenuRect | null;
}

export const BACKGROUND = "#0a0f1e";

// ---- internal mutable draft ---------------------------------------------
type Draft = {
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";
  score: { p1: number; p2: number };
  winner: Side | null;
  paddles: {
    left: { cy: number; vy: number; driven: boolean; drivenVy: number };
    right: { cy: number; vy: number; driven: boolean; drivenVy: number };
  };
  ai: { tracking: boolean; movement: boolean };
  receiver: Side;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    spin: number;
    held: boolean;
    holdTimer: number;
    serveSign: 1 | -1;
    trail: { x: number; y: number; t: number }[];
  } | null;
  obstacles: { index: number; cx: number; cy: number; theta: number }[];
  obstacleClock: number;
  obstacleClockRunning: boolean;
  simTime: number;
  muted: boolean;
};

function clone(s: DeepReadonly<CaromState>): Draft {
  return {
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    resumeScreen: s.resumeScreen,
    score: { ...s.score },
    winner: s.winner,
    paddles: {
      left: { ...s.paddles.left },
      right: { ...s.paddles.right },
    },
    ai: { ...s.ai },
    receiver: s.receiver,
    ball: s.ball
      ? { ...s.ball, trail: s.ball.trail.map((t) => ({ ...t })) }
      : null,
    obstacles: s.obstacles.map((o) => ({ ...o })),
    obstacleClock: s.obstacleClock,
    obstacleClockRunning: s.obstacleClockRunning,
    simTime: s.simTime,
    muted: s.muted,
  };
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

function drawServeSign(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1;
}
function parkedBall(): Draft["ball"] {
  return {
    x: FIELD_CX,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: drawServeSign(),
    trail: [],
  };
}
function obstaclePose(index: number, t: number): ObstacleState {
  const base = OBSTACLE_CENTERS[index] ?? { x: FIELD_CX, y: FIELD_CY };
  const phase = Math.sin((2 * Math.PI * t) / OBSTACLE_SWAY_PERIOD);
  const sign = index === 0 ? 1 : -1;
  return {
    index,
    cx: base.x,
    cy: base.y + sign * OBSTACLE_SWAY_AMP * phase,
    theta: OBSTACLE_SPIN_RATE * t,
  };
}
function bothObstacles(t: number): ObstacleState[] {
  return [obstaclePose(0, t), obstaclePose(1, t)];
}

function titleDraft(
  simTime: number,
  muted: boolean,
  titleIndex: number,
): Draft {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: titleIndex,
    titleIndex,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: {
      left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
      right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parkedBall(),
    obstacles: bothObstacles(0),
    obstacleClock: 0,
    obstacleClockRunning: true,
    simTime,
    muted,
  };
}

function startMatch(d: Draft, mode: Mode): void {
  d.mode = mode;
  d.screen = "countdown";
  d.resumeScreen = "playing";
  d.menuIndex = 0;
  d.score = { p1: 0, p2: 0 };
  d.winner = null;
  d.receiver = "left";
  d.ball = parkedBall();
  d.paddles.left.cy = FIELD_CY;
  d.paddles.left.vy = 0;
  d.paddles.right.cy = FIELD_CY;
  d.paddles.right.vy = 0;
  d.obstacleClock = 0;
  d.obstacleClockRunning = true;
  d.obstacles = bothObstacles(0);
}
function returnToTitle(d: Draft): void {
  const kept = titleDraft(d.simTime, d.muted, d.titleIndex);
  // Preserve driven flags? Title restores every declared field, so use kept fully.
  Object.assign(d, kept);
}

// ---- menus ---------------------------------------------------------------
const HOWTO_ITEMS = ["BACK"] as const;
function menuItems(screen: Screen): readonly string[] {
  switch (screen) {
    case "title":
      return TITLE_ITEMS;
    case "howto":
      return HOWTO_ITEMS;
    case "paused":
      return PAUSE_ITEMS;
    case "matchover":
      return MATCHOVER_ITEMS;
    default:
      return [];
  }
}
function menuRect(screen: Screen, index: number): MenuRect | null {
  const items = menuItems(screen);
  if (index < 0 || index >= items.length) return null;
  const w = 420;
  const h = 58;
  const x = (FIELD_W - w) / 2;
  let startY = 400;
  if (screen === "howto") startY = 540;
  else if (screen === "paused") startY = 310;
  else if (screen === "matchover") startY = 430;
  else if (screen === "title") startY = 390;
  return { x, y: startY + index * 74, w, h };
}
function rectContains(r: MenuRect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// ---- physics ---------------------------------------------------------------
interface CueFlags {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
  score: boolean;
}

function integratePaddle(
  p: { cy: number; vy: number },
  desiredVy: number,
  dt: number,
): void {
  let vy = desiredVy;
  const next = clamp(p.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  if (next !== p.cy + vy * dt && dt > 0) vy = (next - p.cy) / dt;
  p.cy = next;
  p.vy = vy;
}

function movePaddles(
  d: Draft,
  api: UpdateApi,
  dt: number,
  screen: Screen,
): void {
  // Left
  if (d.paddles.left.driven) {
    integratePaddle(d.paddles.left, d.paddles.left.drivenVy, dt);
  } else {
    const up =
      d.mode === "solo"
        ? api.input.value("p1-up") > 0 || api.input.value("p2-up") > 0
          ? 1
          : 0
        : api.input.value("p1-up") > 0
          ? 1
          : 0;
    const down =
      d.mode === "solo"
        ? api.input.value("p1-down") > 0 || api.input.value("p2-down") > 0
          ? 1
          : 0
        : api.input.value("p1-down") > 0
          ? 1
          : 0;
    integratePaddle(d.paddles.left, (down - up) * PADDLE_SPEED, dt);
  }
  // Right
  if (d.paddles.right.driven) {
    integratePaddle(d.paddles.right, d.paddles.right.drivenVy, dt);
  } else if (d.mode === "versus") {
    const up = api.input.value("p2-up") > 0 ? 1 : 0;
    const down = api.input.value("p2-down") > 0 ? 1 : 0;
    integratePaddle(d.paddles.right, (down - up) * PADDLE_SPEED, dt);
  } else {
    // AI
    if (!d.ai.movement) {
      integratePaddle(d.paddles.right, 0, dt);
    } else {
      let target = AI_HOME_Y;
      let deadzone = AI_HOME_DEADZONE;
      if (d.ai.tracking && screen === "playing" && d.ball && d.ball.vx > 0) {
        target = d.ball.y - d.ball.vy * AI_REACT;
        deadzone = AI_DEADZONE;
      }
      const diff = target - d.paddles.right.cy;
      let vy = 0;
      if (Math.abs(diff) > deadzone) {
        const mag = dt > 0 ? Math.min(AI_SPEED, Math.abs(diff) / dt) : AI_SPEED;
        vy = Math.sign(diff) * mag;
      }
      integratePaddle(d.paddles.right, vy, dt);
    }
  }
}

function appendTrail(d: Draft): void {
  if (!d.ball) return;
  d.ball.trail = [
    ...d.ball.trail,
    { x: d.ball.x, y: d.ball.y, t: d.simTime },
  ].filter((s) => d.simTime - s.t <= TRAIL_TIME);
}

function advanceObstacleClock(d: Draft, dt: number): void {
  if (d.obstacleClockRunning) d.obstacleClock += dt;
  d.obstacles = d.obstacles.map((o) => obstaclePose(o.index, d.obstacleClock));
}

type Ball = NonNullable<Draft["ball"]>;

function resolvePaddle(
  ball: Ball,
  side: Side,
  paddleCy: number,
  paddleVy: number,
  flags: CueFlags,
): void {
  const x0 = side === "left" ? P1_X0 : P2_X0;
  const x1 = side === "left" ? P1_X1 : P2_X1;
  const y0 = paddleCy - PADDLE_HALF;
  const y1 = paddleCy + PADDLE_HALF;
  if (!(
    ball.x > x0 - BALL_R &&
    ball.x < x1 + BALL_R &&
    ball.y > y0 - BALL_R &&
    ball.y < y1 + BALL_R
  ))
    return;
  const left = ball.x - (x0 - BALL_R);
  const right = x1 + BALL_R - ball.x;
  const top = ball.y - (y0 - BALL_R);
  const bottom = y1 + BALL_R - ball.y;
  const depths = [left, right, top, bottom];
  let face = 0;
  for (let i = 1; i < 4; i++) if (depths[i]! < depths[face]!) face = i;
  if (face === 0 || face === 1) {
    // paddle hit
    const offset = clamp((ball.y - paddleCy) / PADDLE_HALF, -1, 1);
    const theta = offset * MAX_BOUNCE_ANGLE;
    const speed = Math.min(
      Math.hypot(ball.vx, ball.vy) * SPEED_MULT,
      SPEED_CAP,
    );
    const dir = side === "left" ? 1 : -1;
    ball.vx = dir * speed * Math.cos(theta);
    ball.vy = speed * Math.sin(theta);
    ball.spin = clamp(
      ball.spin + paddleVy * SPIN_FROM_PADDLE,
      -SPIN_CLAMP,
      SPIN_CLAMP,
    );
    ball.x = side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R;
    flags.paddle = true;
  } else if (face === 2) {
    ball.y = y0 - BALL_R;
    if (ball.vy > 0) {
      ball.vy = -ball.vy;
      flags.wall = true;
    }
  } else {
    ball.y = y1 + BALL_R;
    if (ball.vy < 0) {
      ball.vy = -ball.vy;
      flags.wall = true;
    }
  }
}

function resolveObstacle(ball: Ball, ob: ObstacleState, flags: CueFlags): void {
  const cos = Math.cos(ob.theta);
  const sin = Math.sin(ob.theta);
  const dx = ball.x - ob.cx;
  const dy = ball.y - ob.cy;
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  const qx = clamp(lx, -OBSTACLE_HW, OBSTACLE_HW);
  const qy = clamp(ly, -OBSTACLE_HH, OBSTACLE_HH);
  const inside = Math.abs(lx) <= OBSTACLE_HW && Math.abs(ly) <= OBSTACLE_HH;
  let nlx: number;
  let nly: number;
  let cqx = qx;
  let cqy = qy;
  if (inside) {
    const penX = OBSTACLE_HW - Math.abs(lx);
    const penY = OBSTACLE_HH - Math.abs(ly);
    if (penX <= penY) {
      nlx = lx >= 0 ? 1 : -1;
      nly = 0;
      cqx = nlx * OBSTACLE_HW;
      cqy = ly;
    } else {
      nlx = 0;
      nly = ly >= 0 ? 1 : -1;
      cqx = lx;
      cqy = nly * OBSTACLE_HH;
    }
  } else {
    const ddx = lx - qx;
    const ddy = ly - qy;
    const dist = Math.hypot(ddx, ddy);
    if (dist >= BALL_R || dist === 0) return;
    nlx = ddx / dist;
    nly = ddy / dist;
  }
  const nx = nlx * cos - nly * sin;
  const ny = nlx * sin + nly * cos;
  // world contact point
  const wx = ob.cx + (cqx * cos - cqy * sin);
  const wy = ob.cy + (cqx * sin + cqy * cos);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
    flags.obstacle = true;
  }
  ball.x = wx + nx * BALL_R;
  ball.y = wy + ny * BALL_R;
}

function advanceBall(d: Draft, dt: number, flags: CueFlags): void {
  const ball = d.ball;
  if (!ball) return;
  const speed0 = Math.hypot(ball.vx, ball.vy);
  const n = Math.max(1, Math.ceil((speed0 * dt) / MAX_SUBSTEP));
  const h = dt / n;
  const obstaclesAtStart = d.obstacles.map((o) => ({ ...o }));
  for (let i = 0; i < n; i++) {
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > 0) {
      const ang = (ball.spin / sp) * h;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const vx = ball.vx * c - ball.vy * s;
      const vy = ball.vx * s + ball.vy * c;
      ball.vx = vx;
      ball.vy = vy;
    }
    ball.spin *= Math.pow(0.5, h / SPIN_HALFLIFE);
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    // walls
    if (ball.y - BALL_R < 0 && ball.vy < 0) {
      ball.y = BALL_R;
      ball.vy = -ball.vy;
      flags.wall = true;
    } else if (ball.y + BALL_R > FIELD_H && ball.vy > 0) {
      ball.y = FIELD_H - BALL_R;
      ball.vy = -ball.vy;
      flags.wall = true;
    }
    resolvePaddle(ball, "left", d.paddles.left.cy, d.paddles.left.vy, flags);
    resolvePaddle(ball, "right", d.paddles.right.cy, d.paddles.right.vy, flags);
    for (const ob of obstaclesAtStart) resolveObstacle(ball, ob, flags);
  }
}

function serveBall(d: Draft): void {
  const ball = d.ball;
  if (!ball) return;
  const dir = d.receiver === "left" ? -1 : 1;
  ball.holdTimer = 0;
  ball.held = false;
  ball.trail = [];
  ball.vx = dir * SERVE_SPEED * Math.cos(SERVE_ANGLE);
  ball.vy = ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE);
  d.screen = "playing";
}

// confirm action for menus; operates on draft whose screen is menu screen
function confirmMenuItem(d: Draft): void {
  const screen = d.screen;
  const idx = d.menuIndex;
  if (screen === "title") {
    d.titleIndex = idx;
    if (idx === 0) startMatch(d, "solo");
    else if (idx === 1) startMatch(d, "versus");
    else if (idx === 2) {
      d.screen = "howto";
      d.menuIndex = 0;
    }
  } else if (screen === "howto") {
    returnToTitle(d);
  } else if (screen === "paused") {
    if (idx === 0) d.screen = d.resumeScreen;
    else if (idx === 1) startMatch(d, d.mode);
    else if (idx === 2) returnToTitle(d);
  } else if (screen === "matchover") {
    if (idx === 0) startMatch(d, d.mode);
    else if (idx === 1) returnToTitle(d);
  }
}

// ---- debug surface ----------------------------------------------------------
function requireBall(s: DeepReadonly<CaromState>): void {
  if (!s.ball) throw new Error("Carom: no ball is present on the field");
}

const debug: CaromDebugApi = {
  version: CAROM_DEBUG_VERSION,
  clearWorld: (s) => {
    const d = clone(s);
    d.ball = null;
    d.obstacles = [];
    return d;
  },
  spawnBall: (s) => {
    const d = clone(s);
    d.ball = parkedBall();
    return d;
  },
  spawnObstacle: (s, index) => {
    if (index !== 0 && index !== 1)
      throw new Error(`Carom: no obstacle with index ${index}`);
    const d = clone(s);
    const pose = obstaclePose(index, d.obstacleClock);
    d.obstacles = [...d.obstacles.filter((o) => o.index !== index), pose].sort(
      (a, b) => a.index - b.index,
    );
    return d;
  },
  reset: (s) => titleDraft(0, s.muted, 0),
  reconcile: (s) => {
    const d = clone(s);
    d.obstacles = d.obstacles.map((o) =>
      obstaclePose(o.index, d.obstacleClock),
    );
    return d;
  },
  setScreen: (s, screen) => ({ ...clone(s), screen }),
  setMode: (s, mode) => ({ ...clone(s), mode }),
  setMenuIndex: (s, index) => ({ ...clone(s), menuIndex: index }),
  setTitleIndex: (s, index) => ({ ...clone(s), titleIndex: index }),
  setResumeScreen: (s, screen) => ({ ...clone(s), resumeScreen: screen }),
  setScore: (s, p1, p2) => {
    const d = clone(s);
    d.score = { p1, p2 };
    return d;
  },
  setWinner: (s, side) => ({ ...clone(s), winner: side }),
  setReceiver: (s, side) => ({ ...clone(s), receiver: side }),
  setPaddleCy: (s, side, cy) => {
    const d = clone(s);
    d.paddles[side].cy = cy;
    return d;
  },
  setPaddleVy: (s, side, vy) => {
    const d = clone(s);
    d.paddles[side].drivenVy = vy;
    return d;
  },
  setPaddleDriven: (s, side, driven) => {
    const d = clone(s);
    d.paddles[side].driven = driven;
    return d;
  },
  setBallPosition: (s, x, y) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) {
      d.ball.x = x;
      d.ball.y = y;
    }
    return d;
  },
  setBallVelocity: (s, vx, vy) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) {
      d.ball.vx = vx;
      d.ball.vy = vy;
    }
    return d;
  },
  setBallSpin: (s, spin) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) d.ball.spin = spin;
    return d;
  },
  setBallHeld: (s, held) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) d.ball.held = held;
    return d;
  },
  setBallHoldTimer: (s, seconds) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) d.ball.holdTimer = seconds;
    return d;
  },
  setBallServeSign: (s, sign) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) d.ball.serveSign = sign;
    return d;
  },
  drawBallServeSign: (s) => {
    requireBall(s);
    const d = clone(s);
    if (d.ball) d.ball.serveSign = drawServeSign();
    return d;
  },
  setAiTracking: (s, enabled) => {
    const d = clone(s);
    d.ai.tracking = enabled;
    return d;
  },
  setAiMovement: (s, enabled) => {
    const d = clone(s);
    d.ai.movement = enabled;
    return d;
  },
  setMuted: (s, muted) => ({ ...clone(s), muted }),
  setObstacleClock: (s, t) => {
    const d = clone(s);
    d.obstacleClock = t;
    d.obstacles = d.obstacles.map((o) => obstaclePose(o.index, t));
    return d;
  },
  setObstacleClockRunning: (s, running) => ({
    ...clone(s),
    obstacleClockRunning: running,
  }),
  snapshot: (s) => ({
    version: CAROM_DEBUG_VERSION,
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    resumeScreen: s.resumeScreen,
    score: { p1: s.score.p1, p2: s.score.p2 },
    winner: s.winner,
    muted: s.muted,
    paddles: {
      left: {
        cy: s.paddles.left.cy,
        vy: s.paddles.left.vy,
        drivenVy: s.paddles.left.drivenVy,
        driven: s.paddles.left.driven,
      },
      right: {
        cy: s.paddles.right.cy,
        vy: s.paddles.right.vy,
        drivenVy: s.paddles.right.drivenVy,
        driven: s.paddles.right.driven,
      },
    },
    ai: { tracking: s.ai.tracking, movement: s.ai.movement },
    receiver: s.receiver,
    ball: s.ball
      ? {
          x: s.ball.x,
          y: s.ball.y,
          vx: s.ball.vx,
          vy: s.ball.vy,
          speed: Math.hypot(s.ball.vx, s.ball.vy),
          spin: s.ball.spin,
          held: s.ball.held,
          holdTimer: s.ball.holdTimer,
          serveSign: s.ball.serveSign,
          trail: s.ball.trail.map((t) => ({ x: t.x, y: t.y, t: t.t })),
        }
      : null,
    obstacles: s.obstacles.map((o) => ({
      index: o.index,
      cx: o.cx,
      cy: o.cy,
      theta: o.theta,
    })),
    obstacleClock: s.obstacleClock,
    obstacleClockRunning: s.obstacleClockRunning,
    simTime: s.simTime,
  }),
  menuItemRect: (s, index) => menuRect(s.screen, index),
};

// ---- game -------------------------------------------------------------------
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of ACTIONS) {
      api.input.register(name, { keys: [...BINDINGS[name]] });
    }
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 540,
      freqTo: 720,
      durationMs: 70,
      gain: 0.18,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 240,
      freqTo: 180,
      durationMs: 60,
      gain: 0.16,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 340,
      freqTo: 460,
      durationMs: 80,
      gain: 0.18,
    });
    api.audio.define(CUES.score, {
      wave: "square",
      freq: 660,
      freqTo: 990,
      durationMs: 180,
      gain: 0.16,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score-p1", (s) => s.score.p1);
    api.diagnostics.register("score-p2", (s) => s.score.p2);
    api.diagnostics.register("ball", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
    );
    api.diagnostics.register("ball-spin", (s) => (s.ball ? s.ball.spin : 0));
    api.diagnostics.register("score", (s) => `${s.score.p1}-${s.score.p2}`);
    api.diagnostics.register("ball-x", (s) => (s.ball ? s.ball.x : 0));
    api.diagnostics.register("ball-y", (s) => (s.ball ? s.ball.y : 0));
    api.diagnostics.register("ball-vx", (s) => (s.ball ? s.ball.vx : 0));
    api.diagnostics.register("ball-vy", (s) => (s.ball ? s.ball.vy : 0));
    api.diagnostics.register(
      "paddle-left",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} @ ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "paddle-right",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} @ ${s.paddles.right.vy.toFixed(1)}`,
    );
    // Runtime starts unmuted.
    const state = titleDraft(0, false, 0);
    return [state, debug];
  },

  update(state, api: UpdateApi, dt: number): CaromState {
    const d = clone(state);
    d.simTime = state.simTime + dt;

    // Mute: toggles on any screen; debug setMuted poses state.muted, which we
    // push into the runtime so both stay in agreement.
    const mutePressed = api.input.pressed("mute");
    let desiredMuted = d.muted;
    if (mutePressed) desiredMuted = !desiredMuted;
    api.audio.setMuted(desiredMuted);
    d.muted = api.audio.muted();

    const startScreen = state.screen;
    let keyboardConfirmed = false;
    let keyboardMoved = false;

    // --- input for the screen the update began on ---
    if (startScreen === "title") {
      const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
      const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
      api.input.pressed("back"); // read, does nothing
      const confirm = api.input.pressed("confirm");
      const count = TITLE_ITEMS.length;
      if (up) {
        d.menuIndex = (d.menuIndex + count - 1) % count;
        keyboardMoved = true;
      } else if (down) {
        d.menuIndex = (d.menuIndex + 1) % count;
        keyboardMoved = true;
      } else if (confirm) {
        keyboardConfirmed = true;
        confirmMenuItem(d);
      }
    } else if (startScreen === "howto") {
      const confirm = api.input.pressed("confirm");
      const back = api.input.pressed("back");
      if (confirm || back) {
        keyboardConfirmed = true;
        returnToTitle(d);
      }
    } else if (startScreen === "countdown" || startScreen === "playing") {
      if (api.input.pressed("pause")) {
        d.resumeScreen = startScreen;
        d.screen = "paused";
        d.menuIndex = 0;
      }
    } else if (startScreen === "paused") {
      const pause = api.input.pressed("pause");
      const back = api.input.pressed("back");
      if (pause || back) {
        d.screen = d.resumeScreen;
      } else {
        const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
        const down =
          api.input.pressed("p1-down") || api.input.pressed("p2-down");
        const confirm = api.input.pressed("confirm");
        const count = PAUSE_ITEMS.length;
        if (up) {
          d.menuIndex = (d.menuIndex + count - 1) % count;
          keyboardMoved = true;
        } else if (down) {
          d.menuIndex = (d.menuIndex + 1) % count;
          keyboardMoved = true;
        } else if (confirm) {
          keyboardConfirmed = true;
          confirmMenuItem(d);
        }
      }
    } else if (startScreen === "matchover") {
      const back = api.input.pressed("back");
      if (back) {
        keyboardConfirmed = true;
        returnToTitle(d);
      } else {
        const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
        const down =
          api.input.pressed("p1-down") || api.input.pressed("p2-down");
        const confirm = api.input.pressed("confirm");
        const count = MATCHOVER_ITEMS.length;
        if (up) {
          d.menuIndex = (d.menuIndex + count - 1) % count;
          keyboardMoved = true;
        } else if (down) {
          d.menuIndex = (d.menuIndex + 1) % count;
          keyboardMoved = true;
        } else if (confirm) {
          keyboardConfirmed = true;
          confirmMenuItem(d);
        }
      }
    }

    // --- pointer / touch for menu screens (after keyboard) ---
    // Only when we are still on the same menu screen the frame began on.
    const isMenu =
      startScreen === "title" ||
      startScreen === "howto" ||
      startScreen === "paused" ||
      startScreen === "matchover";
    if (isMenu && d.screen === startScreen && !keyboardConfirmed) {
      const items = menuItems(startScreen);
      const startIndex = state.menuIndex;
      let selected: number | null = null;
      const pointer = api.input.pointer();
      for (let i = 0; i < items.length; i++) {
        const r = menuRect(startScreen, i);
        if (r && rectContains(r, pointer.x, pointer.y)) selected = i;
      }
      for (const c of api.input.pointerContacts()) {
        for (let i = 0; i < items.length; i++) {
          const r = menuRect(startScreen, i);
          if (r && rectContains(r, c.x, c.y)) selected = i;
        }
      }
      const samples = api.input.pointerSamples();
      const downById = new Map<number, number>();
      let confirmed: number | null = null;
      let sawDown = false;
      for (const sm of samples) {
        for (let i = 0; i < items.length; i++) {
          const r = menuRect(startScreen, i);
          if (r && rectContains(r, sm.x, sm.y) && sm.type !== "up")
            selected = i;
        }
        if (sm.type === "down") {
          sawDown = true;
          for (let i = 0; i < items.length; i++) {
            const r = menuRect(startScreen, i);
            if (r && rectContains(r, sm.x, sm.y)) downById.set(sm.id, i);
          }
        } else if (sm.type === "up") {
          const downIdx = downById.get(sm.id);
          for (let i = 0; i < items.length; i++) {
            const r = menuRect(startScreen, i);
            if (r && rectContains(r, sm.x, sm.y)) {
              if (downIdx !== undefined && downIdx === i) confirmed = i;
              else if (downIdx === undefined && !sawDown && i === startIndex)
                confirmed = i;
            }
          }
        }
      }
      if (selected !== null) d.menuIndex = selected;
      if (confirmed !== null) {
        d.menuIndex = confirmed;
        // pointer confirm acts like confirm
        confirmMenuItem(d);
      } else if (keyboardMoved && selected !== null) {
        d.menuIndex = selected;
      }
    }

    // --- advance the screen the input left us on ---
    const flags: CueFlags = {
      paddle: false,
      wall: false,
      obstacle: false,
      score: false,
    };
    if (d.screen === "countdown") {
      movePaddles(d, api, dt, "countdown");
      if (d.ball) {
        if (d.ball.held) {
          d.ball.holdTimer -= dt;
          if (d.ball.holdTimer <= 0) {
            serveBall(d);
          } else {
            appendTrail(d);
          }
        } else {
          appendTrail(d);
        }
      }
      advanceObstacleClock(d, dt);
    } else if (d.screen === "playing") {
      movePaddles(d, api, dt, "playing");
      if (d.ball && d.ball.held) {
        d.ball.holdTimer -= dt;
        if (d.ball.holdTimer <= 0) serveBall(d);
        else appendTrail(d);
      } else if (d.ball) {
        advanceBall(d, dt, flags);
        appendTrail(d);
        // scoring
        if (d.ball.x - BALL_R > FIELD_W) {
          flags.score = true;
          d.score = { ...d.score, p1: d.score.p1 + 1 };
          if (d.score.p1 >= WIN_SCORE && d.score.p1 - d.score.p2 >= WIN_LEAD) {
            d.winner = "left";
            d.screen = "matchover";
            d.menuIndex = 0;
          } else {
            d.receiver = "right";
            d.ball = parkedBall();
            d.screen = "countdown";
          }
        } else if (d.ball.x + BALL_R < 0) {
          flags.score = true;
          d.score = { ...d.score, p2: d.score.p2 + 1 };
          if (d.score.p2 >= WIN_SCORE && d.score.p2 - d.score.p1 >= WIN_LEAD) {
            d.winner = "right";
            d.screen = "matchover";
            d.menuIndex = 0;
          } else {
            d.receiver = "left";
            d.ball = parkedBall();
            d.screen = "countdown";
          }
        }
      }
      advanceObstacleClock(d, dt);
    }

    if (flags.paddle) api.audio.play(CUES.paddleHit);
    if (flags.wall) api.audio.play(CUES.wallBounce);
    if (flags.obstacle) api.audio.play(CUES.obstacleBounce);
    if (flags.score) api.audio.play(CUES.score);

    return d;
  },

  render(state, api: RenderApi): void {
    const ctx = api.ctx;
    // field
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    // subtle border
    ctx.strokeStyle = "#26314f";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, FIELD_W - 4, FIELD_H - 4);
    const dim =
      state.screen === "title" ||
      state.screen === "howto" ||
      state.screen === "matchover";

    // net
    ctx.save();
    if (dim) ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#3b4a73";
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(NET_X, 0);
    ctx.lineTo(NET_X, FIELD_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // obstacles
    for (const ob of state.obstacles) {
      ctx.save();
      ctx.translate(ob.cx, ob.cy);
      ctx.rotate(ob.theta);
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.roundRect(-10, -70, 20, 140, 9);
      ctx.fill();
      ctx.fillStyle = "#ddd6fe";
      ctx.fillRect(-3, -60, 6, 120);
      ctx.restore();
    }

    // paddles
    const drawPaddle = (x: number, cy: number, color: string): void => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, cy - PADDLE_HALF, PADDLE_W, PADDLE_H, 8);
      ctx.fill();
    };
    drawPaddle(P1_X0, state.paddles.left.cy, "#22d3ee");
    drawPaddle(P2_X0, state.paddles.right.cy, "#fb7185");

    // trail + ball
    if (state.ball) {
      const ball = state.ball;
      if (ball.trail.length > 1) {
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(ball.trail[0]!.x, ball.trail[0]!.y);
        for (const s of ball.trail) ctx.lineTo(s.x, s.y);
        ctx.lineTo(ball.x, ball.y);
        ctx.stroke();
        ctx.globalAlpha = dim ? 0.45 : 1;
      }
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff7cc";
      ctx.beginPath();
      ctx.arc(ball.x - 3, ball.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // scores + mode label during match screens
    if (
      state.screen === "playing" ||
      state.screen === "countdown" ||
      state.screen === "paused"
    ) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 52px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(state.score.p1), FIELD_CX - 50, 72);
      ctx.textAlign = "left";
      ctx.fillText(String(state.score.p2), FIELD_CX + 50, 72);
      ctx.font = "600 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(state.mode === "solo" ? "SOLO" : "VERSUS", FIELD_CX, 34);
    }

    const overlay = (alpha: number): void => {
      ctx.fillStyle = `rgba(4, 8, 20, ${alpha})`;
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    };
    const drawMenu = (items: readonly string[], screen: Screen): void => {
      ctx.textAlign = "center";
      items.forEach((item, i) => {
        const r = menuRect(screen, i);
        if (!r) return;
        const selected = i === state.menuIndex;
        ctx.fillStyle = selected ? "#facc15" : "#1e293b";
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 12);
        ctx.fill();
        ctx.fillStyle = selected ? "#111827" : "#e2e8f0";
        ctx.font = "700 26px system-ui, sans-serif";
        ctx.fillText(item, r.x + r.w / 2, r.y + 38);
      });
    };

    if (state.screen === "title") {
      overlay(0.35);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "900 110px system-ui, sans-serif";
      ctx.fillText(TITLE_TEXT, FIELD_CX, 240);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 24px system-ui, sans-serif";
      ctx.fillText(
        "Spin the paddle. Bank it off the obstacles. First to 11, by 2.",
        FIELD_CX,
        295,
      );
      drawMenu(TITLE_ITEMS, "title");
      ctx.fillStyle = "#64748b";
      ctx.font = "400 18px system-ui, sans-serif";
      ctx.fillText(
        "W/S or ↑/↓ to choose · Enter to confirm · M mute",
        FIELD_CX,
        660,
      );
    } else if (state.screen === "howto") {
      overlay(0.72);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 54px system-ui, sans-serif";
      ctx.fillText("HOW TO PLAY", FIELD_CX, 150);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "400 25px system-ui, sans-serif";
      const lines = [
        "Solo: move the left paddle with W/S (or ↑/↓).",
        "Versus: player one uses W/S, player two uses ↑/↓.",
        "Move as you strike the ball to add spin — its flight will curve.",
        "Spin fades over time. Walls and spinning obstacles bounce",
        "the ball without changing its speed; use them for bank shots.",
        "Score past your opponent. First to 11 points, leading by 2, wins.",
        "P or Esc pauses · M mutes",
      ];
      lines.forEach((line, i) => ctx.fillText(line, FIELD_CX, 225 + i * 42));
      drawMenu(HOWTO_ITEMS, "howto");
    } else if (state.screen === "countdown") {
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 34px system-ui, sans-serif";
      ctx.fillText("GET READY", FIELD_CX, 150);
    } else if (state.screen === "paused") {
      overlay(0.55);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 56px system-ui, sans-serif";
      ctx.fillText("PAUSED", FIELD_CX, 240);
      drawMenu(PAUSE_ITEMS, "paused");
    } else if (state.screen === "matchover") {
      overlay(0.55);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 54px system-ui, sans-serif";
      const winnerText =
        state.winner === "left"
          ? state.mode === "solo"
            ? "YOU WIN!"
            : "PLAYER ONE WINS!"
          : state.mode === "solo"
            ? "AI WINS"
            : "PLAYER TWO WINS!";
      ctx.fillText(winnerText, FIELD_CX, 230);
      ctx.font = "600 36px system-ui, sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(`${state.score.p1} — ${state.score.p2}`, FIELD_CX, 300);
      drawMenu(MATCHOVER_ITEMS, "matchover");
    }
  },
};
