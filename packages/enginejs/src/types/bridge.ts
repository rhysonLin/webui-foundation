import type { EngineMessageHandler, EngineMessage } from "./message";

export interface UeBridgeLike {
  sendEvent?: (type: string, data?: unknown) => void;
  emit?: (message: EngineMessage) => void;
  on?: (type: string, handler: EngineMessageHandler) => (() => void) | void;
  off?: (type: string, handler: EngineMessageHandler) => void;
  once?: (type: string, handler: EngineMessageHandler) => (() => void) | void;
  __dispatchFromUE?: (type: string, data: unknown) => void;
}

declare global {
  interface Window {
    ueBridge?: UeBridgeLike;
  }
}