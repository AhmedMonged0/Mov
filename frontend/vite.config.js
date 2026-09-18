import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NEXT_PUBLIC_TMDB_API_KEY': JSON.stringify(
      process.env.NEXT_PUBLIC_TMDB_API_KEY || '8cb7e82b636a10030a1cfa44f580e49f'
    ),
  },
});
