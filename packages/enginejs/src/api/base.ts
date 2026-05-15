import type { Engine } from "../core/Engine";

export function ping(engine: Engine): void {
  engine.send("Ping", { from: "frontend" });
}

export function requestSceneState(engine: Engine): void {
  engine.send("RequestSceneState", {});
}