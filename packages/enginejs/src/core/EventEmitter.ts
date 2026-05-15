import type { EngineMessage, EngineMessageHandler } from "../types/message";

export class EventEmitter {
  private listeners = new Map<string, Set<EngineMessageHandler>>();

  on(type: string, handler: EngineMessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(handler);

    return () => {
      this.off(type, handler);
    };
  }

  off(type: string, handler: EngineMessageHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  once(type: string, handler: EngineMessageHandler): () => void {
    const off = this.on(type, (data, message) => {
      off();
      handler(data, message);
    });

    return off;
  }

  emit(type: string, data?: unknown): void {
    const message: EngineMessage = { type, data };

    const exactHandlers = this.listeners.get(type);
    if (exactHandlers) {
      for (const handler of Array.from(exactHandlers)) {
        try {
          handler(data, message);
        } catch (error) {
          console.error("[enginejs] EventEmitter exact handler error:", error);
        }
      }
    }

    const wildcardHandlers = this.listeners.get("*");
    if (wildcardHandlers) {
      for (const handler of Array.from(wildcardHandlers)) {
        try {
          handler(data, message);
        } catch (error) {
          console.error("[enginejs] EventEmitter wildcard handler error:", error);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}