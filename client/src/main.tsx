import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { injectSpeedInsights } from "@vercel/speed-insights";

// Initialize Vercel Speed Insights on the client side
injectSpeedInsights();

createRoot(document.getElementById("root")!).render(<App />);
