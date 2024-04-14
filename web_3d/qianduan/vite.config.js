import { defineConfig } from 'vite'
import WindiCSS from 'vite-plugin-windicss'
import vue from '@vitejs/plugin-vue'

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{//设置路径名
    alias:{
      '@':path.resolve(__dirname,'src'),
    }
  },
  plugins: [vue(),WindiCSS()],
})
