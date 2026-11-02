/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT) || 5173,
    allowedHosts: ["localhost", "127.0.0.1"],
    proxy: { "/api/agent": "http://127.0.0.1:8787" },
  },
});
