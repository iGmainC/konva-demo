import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * Vite 构建配置
 */
export default defineConfig({
  plugins: [react(), cloudflare()],
});
