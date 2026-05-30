import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles/global.css";

// Suppress react-quill findDOMNode deprecation warning
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes("findDOMNode is deprecated")) {
    return;
  }
  originalWarn.call(console, ...args);
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
	<AuthProvider>
		<ToastProvider>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</ToastProvider>
	</AuthProvider>
);
