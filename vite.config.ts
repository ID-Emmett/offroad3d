import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import packageJson from './package.json';


// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_NAME__: JSON.stringify(packageJson.name),
  },
  base: `/${packageJson.name}/`, // 等价 '/offroad3d/'
  server: {
    host: '0.0.0.0', // 配置IP访问
    port: 5555,

    open: false, // 配置自动启动浏览器
    // hmr: false // open this line if no auto hot-reload required
  },
  build: {
    manifest: true
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),

      /**
       * 链接本地源码包
       * 1、在源码目录运行：npm link
       * 2、当前项目目录链接：npm link @orillusion/core
       * 3、配置 vite.config.ts 与 tsconfig.app.json
       * 4、取消链接：npm unlink @orillusion/core 全局： npm unlink
       * 5、重新安装编译包：npm install @orillusion/core 或 npm i
       * 6、注意点：关于 physics effect 等插件，需要确定指定入口文件如 index   同时，注意删除node_modules后再安装依赖，再link 也可以尝试先link再npm i
       * 7、NPM包链接前信息：
       *     "@orillusion/core": "^0.7.2",
       *     "@orillusion/effect": "^0.1.2",
       *     "@orillusion/particle": "^0.1.0",
       *     "@orillusion/physics": "^0.2.2",
       *     "@orillusion/stats": "^0.2.2",
       */
      // '@orillusion/core': 'D:/code/orillusion/src/index',
      // "@orillusion/physics": "D:/code/orillusion/packages/physics/index",
      // "@orillusion/ammo": "D:/code/orillusion/packages/ammo/ammo",
      // "@orillusion/effect": "D:/code/orillusion/packages/effect/index",
      // "@orillusion/particle": "D:/code/orillusion/packages/particle/index",
      // "@orillusion/stats": "D:/code/orillusion/packages/stats/index",
      // "@orillusion/wasm-matrix": "D:/code/orillusion/packages/wasm-matrix",
    }
  }
})
