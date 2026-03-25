import {defineConfig} from 'vite'
import {resolve} from "node:path";
import Base64Loader from "./plugins/base64-loader.ts";

export default defineConfig(env => {
    return {
        base: './',
        build: {
            emptyOutDir: false,
            assetsInlineLimit: () => true,
            rolldownOptions: {
                input: resolve(__dirname, `src/electron-loaders/${env.mode.startsWith('lib:') ? env.mode.split('lib:')[1] : null}.ts`),
                output: [
                    {
                        format: 'iife',
                        name: 'TetrioPlusPlusCustomize',
                        entryFileNames: 'electron-loaders/[name].js',
                        codeSplitting: true
                    }
                ]
            }
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            }
        },
        plugins: [
            Base64Loader(),
        ]
    }
})