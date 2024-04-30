import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import basicSsl from '@vitejs/plugin-basic-ssl'
const fs = require("fs");
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // 配置IP访问
    port: 5555,

    open: false, // 配置自动启动浏览器
    // hmr: false // open this line if no auto hot-reload required
  },
  plugins: [
    // basicSsl(),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
