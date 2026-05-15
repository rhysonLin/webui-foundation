import type { EngineMessageHandler } from "../types/message";
import { EventEmitter } from "./EventEmitter";
import { BridgeAdapter } from "./BridgeAdapter";

export class Engine {
  private readonly emitter = new EventEmitter();
  private readonly bridge = new BridgeAdapter(this.emitter);
  private initialized = false;

  readonly base = {
    ping: () => {
      this.send("Ping", { from: "frontend" });
    },
    requestSceneState: () => {
      this.send("RequestSceneState", {});
    },
  };

  init(): void {
    if (this.initialized) {
      return;
    }

    this.bridge.init();
    this.initialized = true;
  }

  dispose(): void {
    if (!this.initialized) {
      return;
    }

    this.bridge.dispose();
    this.emitter.clear();
    this.initialized = false;
  }

  isBridgeAvailable(): boolean {
    return this.bridge.isBridgeAvailable();
  }

  send(type: string, data?: unknown): void {
    this.bridge.send(type, data);
  }

  on(type: string, handler: EngineMessageHandler): () => void {
    return this.emitter.on(type, handler);
  }

  off(type: string, handler: EngineMessageHandler): void {
    this.emitter.off(type, handler);
  }

  once(type: string, handler: EngineMessageHandler): () => void {
    return this.emitter.once(type, handler);
  }
}