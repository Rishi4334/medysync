import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
	const [input, init] = args;
	const startedAt = Date.now();
	const method = (init?.method ?? "GET").toUpperCase();
	const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
	try {
		const response = await originalFetch(...args);
		console.info("[frontend] API", { method, url, status: response.status, durationMs: Date.now() - startedAt });
		return response;
	} catch (error) {
		console.error("[frontend] API failed", { method, url, durationMs: Date.now() - startedAt, error: String(error) });
		throw error;
	}
};

createRoot(document.getElementById("root")!).render(<App />);
