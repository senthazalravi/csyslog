import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/ollama-api": {
        target: "http://localhost:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama-api/, ""),
      },
      "/nvidia-api": {
        target: "https://integrate.api.nvidia.com/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ""),
      },
      "/openai-api": {
        target: "https://api.openai.com/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openai-api/, ""),
      },
      "/grok-api": {
        target: "https://api.x.ai/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grok-api/, ""),
      },
      "/deepseek-api": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deepseek-api/, ""),
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
