import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initQABridge } from "./phaser/qa-bridge";

initQABridge();

createRoot(document.getElementById("root")!).render(<App />);
