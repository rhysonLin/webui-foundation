import "./types/bridge";

export { Engine } from "./core/Engine";
export type { EngineMessage, EngineMessageHandler } from "./types/message";

import { Engine } from "./core/Engine";

export function createEngine(): Engine {
  const engine = new Engine();
  engine.init();
  return engine;
}

export const baseApi = {
  ping(engine: Engine): void {
    engine.base.ping();
  },
  requestSceneState(engine: Engine): void {
    engine.base.requestSceneState();
  },
};