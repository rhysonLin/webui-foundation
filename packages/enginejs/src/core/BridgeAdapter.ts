import type { EngineMessage } from "../types/message";
import { EventEmitter } from "./EventEmitter";

export class BridgeAdapter {
  private initialized = false;

  constructor(private readonly emitter: EventEmitter) {}

  init(): void {
    if (this.initialized) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("ue-message", this.handleWindowMessage as EventListener);
    this.initialized = true;
  }

  dispose(): void {
    if (!this.initialized) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.removeEventListener("ue-message", this.handleWindowMessage as EventListener);
    this.initialized = false;
  }

  isBridgeAvailable(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    return typeof window.ueBridge?.sendEvent === "function";
  }

  send(type: string, data?: unknown): void {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof window.ueBridge?.sendEvent === "function") {
      window.ueBridge.sendEvent(type, data);
      return;
    }

    console.warn("[enginejs] ueBridge.sendEvent is not available", { type, data });
  }

  private handleWindowMessage = (event: Event): void => {
    const customEvent = event as CustomEvent<EngineMessage>;
    const detail = customEvent.detail;

    if (!detail || typeof detail.type !== "string" || detail.type.length === 0) {
      return;
    }

    this.emitter.emit(detail.type, detail.data);
  };
}