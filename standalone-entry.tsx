import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import { initCloudSync } from "./app/cloudSync";
import "./app/globals.css";
import "./app/full.css";
import "./app/portal.css";
import "./app/yj.css";

const root = document.getElementById("root");
if (root) {
  initCloudSync().finally(() => createRoot(root).render(<Home />));
}
