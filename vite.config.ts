import { defineConfig } from "vite";
import Monkey from "vite-plugin-monkey";
import { resolve } from "node:path";
import Base64Loader from "./plugins/base64-loader.ts";

export default defineConfig({
    base: "./",
    build: {
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    plugins: [
        Base64Loader(),
        Monkey({
            entry: "src/main.ts",
            build: {
                fileName: "tetrio-chinese.user.js",
            },
            userscript: {
                name: "tetr.io 汉化",
                namespace: "a-minos",
                version: "3.0.0",
                match: ["https://tetr.io"],
                "run-at": "document-start",
            },
        }),
    ],
});