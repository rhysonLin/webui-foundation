import { useEffect, useMemo, useState } from "react";
import { createEngine, type Engine } from "enginejs";

type LogItem = {
  id: number;
  text: string;
};

function getBridgeInfo() {
  const bridge = (window as any).ueBridge;

  return {
    exists: !!bridge,
    type: typeof bridge,
    sendEvent: typeof bridge?.sendEvent,
    on: typeof bridge?.on,
    off: typeof bridge?.off,
    once: typeof bridge?.once,
  };
}

export default function App() {
  const engine: Engine = useMemo(() => createEngine(), []);

  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const [ueReady, setUeReady] = useState(false);
  const [sceneState, setSceneState] = useState<unknown>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [bridgeInfo, setBridgeInfo] = useState(getBridgeInfo());

  const pushLog = (text: string) => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 80));
  };

  useEffect(() => {
    setBridgeAvailable(engine.isBridgeAvailable());
    setBridgeInfo(getBridgeInfo());

    pushLog(`[Init] bridgeAvailable=${engine.isBridgeAvailable()}`);
    pushLog(`[Init] bridgeInfo=${JSON.stringify(getBridgeInfo())}`);

    const offAny = engine.on("*", (data, message) => {
      pushLog(`[engine:*] ${message.type} -> ${JSON.stringify(data)}`);
    });

    const offReady = engine.on("UEReady", (data) => {
      setUeReady(true);
      pushLog(`[engine] UEReady -> ${JSON.stringify(data)}`);
    });

    const offPong = engine.on("Pong", (data) => {
      pushLog(`[engine] Pong -> ${JSON.stringify(data)}`);
    });

    const offSceneState = engine.on("SceneState", (data) => {
      setSceneState(data);
      setUeReady(true);
      pushLog(`[engine] SceneState -> ${JSON.stringify(data)}`);
    });

    if (engine.isBridgeAvailable()) {
      pushLog("[Init] resend BridgeReady");
      engine.send("BridgeReady", { from: "react-after-listeners" });

      pushLog("[Init] request SceneState");
      engine.base.requestSceneState();
    }

    return () => {
      offAny();
      offReady();
      offPong();
      offSceneState();
      engine.dispose();
    };
  }, [engine]);

  const refreshBridgeInfo = () => {
    setBridgeAvailable(engine.isBridgeAvailable());
    setBridgeInfo(getBridgeInfo());
    pushLog("[Action] Refresh Bridge State");
  };

  const rawSend = (type: string, data?: unknown) => {
    pushLog(`[RawSend] ${type} -> ${JSON.stringify(data)}`);
    (window as any).ueBridge?.sendEvent?.(type, data);
  };

  return (
    <div className="app-root">
      <div className="side-panel">
        <div className="panel-header">
          <h1 className="panel-title">EngineJS Demo</h1>
          <div className="panel-subtitle">Web UI Foundation</div>
        </div>

        <div className="card">
          <div className="status-row">
            <span className="status-label">Bridge Available</span>
            <span className={bridgeAvailable ? "badge success" : "badge danger"}>
              {bridgeAvailable ? "Yes" : "No"}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">UE Ready</span>
            <span className={ueReady ? "badge success" : "badge danger"}>
              {ueReady ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Bridge Diagnostics</div>
          <pre className="code-block">
            {JSON.stringify(bridgeInfo, null, 2)}
          </pre>
        </div>

        <div className="card">
          <div className="section-title">Base Actions</div>
          <div className="button-grid">
            <button
              onClick={() => {
                pushLog("[Action] engine.base.ping");
                engine.base.ping();
              }}
            >
              Ping
            </button>

            <button
              onClick={() => {
                pushLog("[Action] engine.base.requestSceneState");
                engine.base.requestSceneState();
              }}
            >
              Request Scene State
            </button>

            <button onClick={() => rawSend("Ping", { from: "raw-window-call" })}>
              Raw Ping
            </button>

            <button onClick={() => rawSend("RequestSceneState", {})}>
              Raw RequestSceneState
            </button>

            <button onClick={() => rawSend("BridgeReady", { from: "manual-frontend" })}>
              Raw BridgeReady
            </button>

            <button onClick={refreshBridgeInfo}>Refresh Bridge State</button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Scene State</div>
          <pre className="code-block scene-state-block">
            {sceneState ? JSON.stringify(sceneState, null, 2) : "No scene state yet"}
          </pre>
        </div>

        <div className="card logs-card">
          <div className="logs-header">
            <div className="section-title">Logs</div>
            <button className="small-button" onClick={() => setLogs([])}>
              Clear
            </button>
          </div>

          <div className="logs-list">
            {logs.length === 0 ? (
              <div className="empty-text">No logs yet</div>
            ) : (
              logs.map((item) => (
                <div key={item.id} className="log-item">
                  {item.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="scene-pass-through" />
    </div>
  );
}