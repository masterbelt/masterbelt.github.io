import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/generated/spec/")) {
            return "spec-markdown";
          }

          if (id.includes("/src/generated/code-highlights.json")) {
            return "spec-highlights";
          }

          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) {
            return "react";
          }

          if (
            id.includes("/node_modules/react-markdown/") ||
            id.includes("/node_modules/remark-") ||
            id.includes("/node_modules/mdast-") ||
            id.includes("/node_modules/micromark") ||
            id.includes("/node_modules/unified/") ||
            id.includes("/node_modules/unist-") ||
            id.includes("/node_modules/github-slugger/")
          ) {
            return "markdown";
          }

          if (id.includes("/node_modules/react-icons/")) {
            return "icons";
          }
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
