import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path, {resolve} from "path";
import vueSetupExtend from 'vite-plugin-vue-setup-extend'
import {ModuleFormat} from "rollup";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(),vueSetupExtend()],
    resolve: {
        alias: {
            '@base': resolve(__dirname, './src/'),
            assets: resolve(__dirname,'./src/assets'),
        }
    },
    build: {
        assetsInlineLimit:0,
        outDir: 'qy',
        lib: {
            entry:path.resolve(__dirname,'./index.ts'),
            name:'qy-base'
        },
        rollupOptions:{
            external: ["vue", "pinia", 'axios', 'nprogress', 'vue-router', 'element-plus','xlsx'],
            output:{
                globals:{
                    vue:"Vue",
                    pinia:"Pinia",
                    axios:"Axios"
                }
            }
        }
    }
})
