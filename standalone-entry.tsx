import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./app/page";
import "./app/globals.css";
import "./app/full.css";
import "./app/portal.css";
import "./app/yj.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Home />);
