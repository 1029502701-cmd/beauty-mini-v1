import { defineConfig } from '@tarojs/cli'
import path from 'path'

export default defineConfig({
  projectName: 'beauty-mini-v1',
  date: '2026-08-03',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
  '@tarojs/plugin-framework-react'
],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      }
    },
    npm: {
      baseDir: '.'
    },
    webpackChain(chain) {
      chain.resolve.alias.set('@', path.resolve(__dirname, '../src'))
      chain.resolve.alias.set('@taro/router', path.resolve(__dirname, '../src/@taro/router.ts'))
    }
  },
  h5: {}
})
