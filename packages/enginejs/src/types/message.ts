export type EngineMessage = {
  type: string;
  data?: unknown;
};

export type EngineMessageHandler = (
  data: unknown,
  message: EngineMessage
) => void;