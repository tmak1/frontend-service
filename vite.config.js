import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS SECTION ---
  test: {
    globals: true,
    environment: "jsdom", // <--- Simulates a browser
    setupFiles: "./src/setupTests.js",
  },
  // ------------------------
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
});
