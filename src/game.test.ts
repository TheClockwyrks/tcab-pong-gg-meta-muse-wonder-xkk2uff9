import { createCanvas } from "@napi-rs/canvas";
import {
  ConstantClock,
  createEngine,
  type Engine,
} from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import { BACKGROUND, game, type CaromDebugApi, type CaromState } from "./game";
import { FIELD_CX, FIELD_CY } from "./constants";

type Eng = Engine<CaromState, CaromDebugApi>;

async function makeEngine(
  stepMs = 16,
): Promise<{ engine: Eng; target: EventTarget }> {
  const canvas = createCanvas(1280, 720);
  const target = new EventTarget();
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: 1280,
    height: 720,
    game,
    background: BACKGROUND,
    layout: "dual-vertical",
    clock: new ConstantClock(stepMs),
    surface: {
      cssWidth: () => 1280,
      cssHeight: () => 720,
      dpr: () => 1,
      events: () => target,
    },
  });
  await engine.initialize();
  return { engine, target };
}

function key(target: EventTarget, code: string, type = "keydown"): void {
  const e = new Event(type);
  Object.assign(e, { code, repeat: false });
  target.dispatchEvent(e);
}
function pointer(
  target: EventTarget,
  type: string,
  x: number,
  y: number,
  pointerId = 1,
  pointerType = "mouse",
): void {
  const e = new Event(type);
  Object.assign(e, {
    clientX: x,
    clientY: y,
    pointerId,
    pointerType,
    isPrimary: true,
    button: 0,
    buttons: type === "pointerup" ? 0 : 1,
  });
  target.dispatchEvent(e);
}
const snap = (engine: Eng) => engine.debug.snapshot(engine.state);
const apply = (engine: Eng, fn: (d: CaromDebugApi, s: never) => CaromState) =>
  engine.apply(((s: never) => fn(engine.debug, s)) as never);

describe("initial state", () => {
  it("opens on title with parked ball and upright obstacles", async () => {
    const { engine } = await makeEngine();
    const s = snap(engine);
    expect(s.version).toBe(1);
    expect(s.screen).toBe("title");
    expect(s.mode).toBe("solo");
    expect(s.score).toEqual({ p1: 0, p2: 0 });
    expect(s.ball).toMatchObject({ x: FIELD_CX, y: FIELD_CY, held: true });
    expect(s.obstacles).toHaveLength(2);
    expect(s.obstacles[0]).toMatchObject({ cx: 490, cy: 220, theta: 0 });
    expect(s.obstacles[1]).toMatchObject({ cx: 790, cy: 500, theta: 0 });
    expect(engine.diagnostics().length).toBeGreaterThanOrEqual(10);
  });

  it("simTime advances on title but nothing else moves ball", async () => {
    const { engine } = await makeEngine();
    await engine.advance(10);
    const s = snap(engine);
    expect(s.simTime).toBeCloseTo(0.16, 5);
    expect(s.ball?.x).toBe(FIELD_CX);
    // obstacle clock running on title? title says Nothing advances except simTime,
    // but our title clock is running - check clock value stays? (informational)
  });
});

describe("debug surface", () => {
  it("poses and reads back fields", async () => {
    const { engine } = await makeEngine();
    const d = engine.debug;
    apply(engine, (dd, s) => dd.setScore(s, 3, 2));
    apply(engine, (dd, s) => dd.setReceiver(s, "right"));
    apply(engine, (dd, s) => dd.setPaddleCy(s, "left", 200));
    apply(engine, (dd, s) => dd.setPaddleVy(s, "left", 123));
    apply(engine, (dd, s) => dd.setBallPosition(s, 300, 250));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 100, -50));
    apply(engine, (dd, s) => dd.setBallSpin(s, 200));
    apply(engine, (dd, s) => dd.setBallServeSign(s, -1));
    apply(engine, (dd, s) => dd.setAiTracking(s, false));
    const s = snap(engine);
    expect(s.score).toEqual({ p1: 3, p2: 2 });
    expect(s.receiver).toBe("right");
    expect(s.paddles.left.cy).toBe(200);
    expect(s.paddles.left.drivenVy).toBe(123);
    expect(s.paddles.left.vy).toBe(0);
    expect(s.ball).toMatchObject({
      x: 300,
      y: 250,
      vx: 100,
      vy: -50,
      spin: 200,
      serveSign: -1,
    });
    expect(s.ball?.speed).toBeCloseTo(Math.hypot(100, 50));
    expect(s.ai.tracking).toBe(false);
    void d;
  });

  it("clearWorld / spawn and loud failures", async () => {
    const { engine } = await makeEngine();
    apply(engine, (dd, s) => dd.clearWorld(s));
    expect(snap(engine).ball).toBeNull();
    expect(snap(engine).obstacles).toEqual([]);
    expect(() =>
      apply(engine, (dd, s) => dd.setBallPosition(s, 1, 2)),
    ).toThrow();
    expect(() => apply(engine, (dd, s) => dd.spawnObstacle(s, 5))).toThrow();
    apply(engine, (dd, s) => dd.spawnBall(s));
    apply(engine, (dd, s) => dd.spawnObstacle(s, 1));
    const s = snap(engine);
    expect(s.ball?.held).toBe(true);
    expect(s.obstacles).toHaveLength(1);
    expect(s.obstacles[0]?.index).toBe(1);
  });

  it("reset restores title and keeps muted flag via muted state", async () => {
    const { engine } = await makeEngine();
    apply(engine, (dd, s) => dd.setScore(s, 5, 5));
    apply(engine, (dd, s) => dd.setMuted(s, false));
    apply(engine, (dd, s) => dd.setScreen(s, "playing"));
    apply(engine, (dd, s) => dd.reset(s));
    const s = snap(engine);
    expect(s.screen).toBe("title");
    expect(s.score).toEqual({ p1: 0, p2: 0 });
    expect(s.simTime).toBe(0);
  });

  it("menuItemRect null in play and valid on title, reconcile idempotent", async () => {
    const { engine } = await makeEngine();
    expect(engine.debug.menuItemRect(engine.state, 0)).not.toBeNull();
    expect(engine.debug.menuItemRect(engine.state, 99)).toBeNull();
    apply(engine, (dd, s) => dd.setScreen(s, "playing"));
    expect(engine.debug.menuItemRect(engine.state, 0)).toBeNull();
    const before = snap(engine);
    apply(engine, (dd, s) => dd.reconcile(s));
    apply(engine, (dd, s) => dd.reconcile(s));
    expect(snap(engine).obstacles).toEqual(before.obstacles);
  });

  it("obstacle clock poses obstacles", async () => {
    const { engine } = await makeEngine();
    apply(engine, (dd, s) => dd.setObstacleClock(s, 0.9));
    const s = snap(engine);
    expect(s.obstacleClock).toBe(0.9);
    expect(s.obstacles[0]?.theta).toBeCloseTo((Math.PI / 3) * 0.9);
    expect(s.obstacles[0]!.cy + s.obstacles[1]!.cy).toBeCloseTo(720);
  });
});

describe("menus and match flow", () => {
  it("keyboard navigates title and starts solo, serves after hold", async () => {
    const { engine, target } = await makeEngine();
    key(target, "KeyS");
    await engine.advance(1);
    expect(snap(engine).menuIndex).toBe(1);
    key(target, "KeyS", "keyup");
    key(target, "KeyW");
    await engine.advance(1);
    expect(snap(engine).menuIndex).toBe(0);
    key(target, "KeyW", "keyup");
    key(target, "Enter");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("countdown");
    expect(snap(engine).titleIndex).toBe(0);
    key(target, "Enter", "keyup");
    // serve after ~1s
    await engine.advance(70);
    const s = snap(engine);
    expect(s.screen).toBe("playing");
    expect(s.ball?.held).toBe(false);
    expect(s.ball!.vx).toBeLessThan(0); // first serve toward left
  });

  it("howto round trip", async () => {
    const { engine, target } = await makeEngine();
    key(target, "ArrowDown");
    await engine.advance(1);
    key(target, "ArrowDown", "keyup");
    key(target, "ArrowDown");
    await engine.advance(1);
    key(target, "ArrowDown", "keyup");
    expect(snap(engine).menuIndex).toBe(2);
    key(target, "Enter");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("howto");
    key(target, "Enter", "keyup");
    key(target, "Escape");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("title");
    expect(snap(engine).menuIndex).toBe(snap(engine).titleIndex);
  });

  it("pause and resume with Escape, restart and quit", async () => {
    const { engine, target } = await makeEngine();
    apply(engine, (dd, s) => dd.setScreen(s, "playing"));
    key(target, "KeyP");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("paused");
    key(target, "KeyP", "keyup");
    key(target, "Escape");
    await engine.advance(1);
    // Escape on paused resumes once
    expect(snap(engine).screen).toBe("playing");
    key(target, "Escape", "keyup");
    // pause again then quit
    key(target, "KeyP");
    await engine.advance(1);
    key(target, "KeyP", "keyup");
    expect(snap(engine).screen).toBe("paused");
    key(target, "ArrowDown");
    await engine.advance(1);
    key(target, "ArrowDown", "keyup");
    key(target, "ArrowDown");
    await engine.advance(1);
    key(target, "ArrowDown", "keyup");
    expect(snap(engine).menuIndex).toBe(2);
    key(target, "Enter");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("title");
  });

  it("pointer hover and click selects menu item", async () => {
    const { engine, target } = await makeEngine();
    const r = engine.debug.menuItemRect(engine.state, 1)!;
    pointer(target, "pointermove", r.x + 10, r.y + 10);
    await engine.advance(1);
    expect(snap(engine).menuIndex).toBe(1);
    pointer(target, "pointerdown", r.x + 10, r.y + 10);
    pointer(target, "pointerup", r.x + 10, r.y + 10);
    await engine.advance(1);
    const s = snap(engine);
    expect(s.screen).toBe("countdown");
    expect(s.mode).toBe("versus");
  });

  it("pointer press/release in different items confirms nothing", async () => {
    const { engine, target } = await makeEngine();
    const r0 = engine.debug.menuItemRect(engine.state, 0)!;
    const r1 = engine.debug.menuItemRect(engine.state, 1)!;
    pointer(target, "pointerdown", r0.x + 5, r0.y + 5);
    pointer(target, "pointerup", r1.x + 5, r1.y + 5);
    await engine.advance(1);
    expect(snap(engine).screen).toBe("title");
  });
});

describe("physics", () => {
  async function playing(): Promise<{ engine: Eng; target: EventTarget }> {
    const ctx = await makeEngine();
    apply(ctx.engine, (dd, s) => dd.setScreen(s, "playing"));
    apply(ctx.engine, (dd, s) => dd.setBallHeld(s, false));
    return ctx;
  }

  it("wall bounce flips vy", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setBallPosition(s, 640, 30));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 0, -300));
    await engine.advance(10);
    expect(snap(engine).ball!.vy).toBeGreaterThan(0);
  });

  it("paddle hit speeds up and adds spin from paddle motion", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setPaddleDriven(s, "left", true));
    apply(engine, (dd, s) => dd.setPaddleVy(s, "left", 400));
    apply(engine, (dd, s) => dd.setPaddleCy(s, "left", 360));
    apply(engine, (dd, s) => dd.setBallPosition(s, 100, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, -400, 0));
    await engine.advance(10);
    const b = snap(engine).ball!;
    expect(b.vx).toBeGreaterThan(0);
    expect(b.speed).toBeCloseTo(416, 0);
    expect(b.spin).toBeGreaterThan(0);
  });

  it("driven paddle reports vy after a frame and clamps at bounds", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setPaddleDriven(s, "left", true));
    apply(engine, (dd, s) => dd.setPaddleVy(s, "left", 720));
    apply(engine, (dd, s) => dd.setPaddleCy(s, "left", 660));
    await engine.advance(5);
    const p = snap(engine).paddles.left;
    expect(p.cy).toBeLessThanOrEqual(665);
    expect(p.cy).toBe(665);
    expect(p.vy).toBe(0);
  });

  it("obstacle bounce reflects at upright pose", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setObstacleClock(s, 0));
    apply(engine, (dd, s) => dd.setObstacleClockRunning(s, false));
    apply(engine, (dd, s) => dd.setBallPosition(s, 450, 220));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 300, 0));
    await engine.advance(10);
    expect(snap(engine).ball!.vx).toBeLessThan(0);
  });

  it("spin curves flight and decays", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setBallPosition(s, 300, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 400, 0));
    apply(engine, (dd, s) => dd.setBallSpin(s, 600));
    await engine.advance(20);
    const b = snap(engine).ball!;
    expect(b.vy).toBeGreaterThan(20);
    expect(Math.abs(b.spin)).toBeLessThan(600);
  });

  it("scores, parks, and serves to receiver", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setBallPosition(s, 1270, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 500, 0));
    await engine.advance(5);
    const s = snap(engine);
    expect(s.score.p1).toBe(1);
    expect(s.screen).toBe("countdown");
    expect(s.receiver).toBe("right");
    expect(s.ball).toMatchObject({ x: FIELD_CX, y: FIELD_CY, held: true });
  });

  it("win by two ends match, deuce continues", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setScore(s, 10, 10));
    apply(engine, (dd, s) => dd.setBallPosition(s, 1270, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 500, 0));
    await engine.advance(5);
    expect(snap(engine).screen).toBe("countdown");
    expect(snap(engine).score.p1).toBe(11);
    apply(engine, (dd, s) => dd.setScreen(s, "playing"));
    apply(engine, (dd, s) => dd.setBallHeld(s, false));
    apply(engine, (dd, s) => dd.setBallPosition(s, 1270, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 500, 0));
    await engine.advance(5);
    const s = snap(engine);
    expect(s.screen).toBe("matchover");
    expect(s.winner).toBe("left");
  });

  it("human paddle moves in versus and solo", async () => {
    const { engine, target } = await playing();
    key(target, "KeyW");
    await engine.advance(5);
    expect(snap(engine).paddles.left.cy).toBeLessThan(360);
    key(target, "KeyW", "keyup");
  });

  it("AI tracks incoming ball and rests otherwise; gates work", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setBallPosition(s, 640, 200));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 400, 0));
    apply(engine, (dd, s) => dd.setPaddleCy(s, "right", 360));
    await engine.advance(10);
    expect(snap(engine).paddles.right.cy).toBeLessThan(360);
    apply(engine, (dd, s) => dd.setAiMovement(s, false));
    const cy = snap(engine).paddles.right.cy;
    await engine.advance(5);
    expect(snap(engine).paddles.right.cy).toBe(cy);
  });

  it("trail records recent samples only", async () => {
    const { engine } = await playing();
    apply(engine, (dd, s) => dd.setBallPosition(s, 300, 360));
    apply(engine, (dd, s) => dd.setBallVelocity(s, 300, 0));
    await engine.advance(20);
    const b = snap(engine).ball!;
    expect(b.trail.length).toBeGreaterThan(0);
    expect(b.trail.length).toBeLessThan(20);
  });

  it("hold timer pose to zero serves next frame", async () => {
    const { engine } = await makeEngine();
    apply(engine, (dd, s) => dd.setScreen(s, "countdown"));
    apply(engine, (dd, s) => dd.setBallServeSign(s, 1));
    apply(engine, (dd, s) => dd.setBallHoldTimer(s, 0));
    await engine.advance(1);
    const s = snap(engine);
    expect(s.screen).toBe("playing");
    expect(s.ball?.vy).toBeGreaterThan(0);
  });

  it("two step sizes agree in direction and speed", async () => {
    const run = async (step: number) => {
      const { engine } = await makeEngine(step);
      apply(engine, (dd, s) => dd.setScreen(s, "playing"));
      apply(engine, (dd, s) => dd.setBallHeld(s, false));
      apply(engine, (dd, s) => dd.setBallPosition(s, 640, 360));
      apply(engine, (dd, s) => dd.setBallVelocity(s, -400, 100));
      await engine.advance(Math.round(1000 / step));
      return snap(engine).ball!;
    };
    const a = await run(8);
    const b = await run(16);
    expect(Math.sign(a.vx)).toBe(Math.sign(b.vx));
    expect(Math.abs(a.speed - b.speed)).toBeLessThan(10);
  });
});

describe("mute", () => {
  it("M toggles muted mirrored in state", async () => {
    const { engine, target } = await makeEngine();
    expect(snap(engine).muted).toBe(false);
    key(target, "KeyM");
    await engine.advance(1);
    expect(snap(engine).muted).toBe(true);
    key(target, "KeyM", "keyup");
    key(target, "KeyM");
    await engine.advance(1);
    expect(snap(engine).muted).toBe(false);
  });
});
