import { useEffect, useMemo, useState } from "react";
import { createEngine, type Engine } from "enginejs";
import "./App.css";
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
  const [worldForm, setWorldForm] = useState({
    x: "0",
    y: "0",
    z: "300",
    pitch: "-20",
    yaw: "0",
    roll: "0",
  });

  const [geoForm, setGeoForm] = useState({
    longitude: "116.397",
    latitude: "39.908",
    height: "500",
    pitch: "-20",
    yaw: "0",
    roll: "0",
  });
  
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

    const offMoveWorldResult = engine.on("Camera.MoveToWorld.Result", (data) => {
      pushLog(`[engine] Camera.MoveToWorld.Result -> ${JSON.stringify(data)}`);
    });

    const offMoveGeoResult = engine.on("Camera.MoveToGeo.Result", (data) => {
      pushLog(`[engine] Camera.MoveToGeo.Result -> ${JSON.stringify(data)}`);
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
      offMoveWorldResult();
      offMoveGeoResult();
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

  const toNumber = (value: string, fallback = 0) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
  };

  const flyToWorldLocation = () => {
    const payload = {
      x: toNumber(worldForm.x),
      y: toNumber(worldForm.y),
      z: toNumber(worldForm.z),
      pitch: toNumber(worldForm.pitch),
      yaw: toNumber(worldForm.yaw),
      roll: toNumber(worldForm.roll),
    };

    pushLog(`[Action] Camera.MoveToWorld -> ${JSON.stringify(payload)}`);
    engine.send("Camera.MoveToWorld", payload);
  };

  const flyToGeoLocation = () => {
    const payload = {
      longitude: toNumber(geoForm.longitude),
      latitude: toNumber(geoForm.latitude),
      height: toNumber(geoForm.height),
      pitch: toNumber(geoForm.pitch),
      yaw: toNumber(geoForm.yaw),
      roll: toNumber(geoForm.roll),
    };

    pushLog(`[Action] Camera.MoveToGeo -> ${JSON.stringify(payload)}`);
    engine.send("Camera.MoveToGeo", payload);
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
          <div className="section-title">Camera Move - UE World Location</div>

          <div className="form-help">
            输入 UE 世界坐标 FVector：X / Y / Z。旋转角 FRotator：Pitch / Yaw / Roll，单位为度。
          </div>

          <div className="input-grid">
            <div>
              X
              <input
                value={worldForm.x}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, x: e.target.value }))}
                placeholder="UE X，例如 1000"
              />
            </div>

            <label>
              Y
              <input
                value={worldForm.y}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, y: e.target.value }))}
                placeholder="UE Y，例如 2000"
              />
            </label>

            <label>
              Z
              <input
                value={worldForm.z}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, z: e.target.value }))}
                placeholder="UE Z，例如 300"
              />
            </label>

            <label>
              Pitch
              <input
                value={worldForm.pitch}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, pitch: e.target.value }))}
                placeholder="例如 -20"
              />
            </label>

            <label>
              Yaw
              <input
                value={worldForm.yaw}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, yaw: e.target.value }))}
                placeholder="例如 90"
              />
            </label>

            <label>
              Roll
              <input
                value={worldForm.roll}
                onChange={(e) => setWorldForm((prev) => ({ ...prev, roll: e.target.value }))}
                placeholder="通常填 0"
              />
            </label>
          </div>

          <button onClick={flyToWorldLocation}>
            Fly To UE World Location
          </button>
        </div>

        <div className="card">
          <div className="section-title">Camera Move - Longitude / Latitude / Height</div>

          <div className="form-help">
            输入 Cesium 经纬度坐标：Longitude / Latitude 单位为度，Height 单位为米。
            旋转角 FRotator：Pitch / Yaw / Roll，单位为度。
          </div>

          <div className="input-grid">
            <div>
              Longitude
              <input className="JWXIPT"
                value={geoForm.longitude}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder="经度，例如 116.397"
              />
            </div>

            <label>
              Latitude
              <input
                value={geoForm.latitude}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="纬度，例如 39.908"
              />
            </label>

            <label>
              Height
              <input
                value={geoForm.height}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, height: e.target.value }))}
                placeholder="高度，单位米，例如 500"
              />
            </label>

            <label>
              Pitch
              <input
                value={geoForm.pitch}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, pitch: e.target.value }))}
                placeholder="例如 -20"
              />
            </label>

            <label>
              Yaw
              <input
                value={geoForm.yaw}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, yaw: e.target.value }))}
                placeholder="例如 0"
              />
            </label>

            <label>
              Roll
              <input
                value={geoForm.roll}
                onChange={(e) => setGeoForm((prev) => ({ ...prev, roll: e.target.value }))}
                placeholder="通常填 0"
              />
            </label>
          </div>

          <button onClick={flyToGeoLocation}>
            Fly To Geo Location
          </button>
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