// @ts-nocheck

import { replacements } from "@/modules/inGameTranslator";
import { processPlacement } from "@/utils/replacement";

export default async () => {
    const pluginStateStorageKey = "tetrio_plus_plus_customize-chinese_translate-state";

    createRewriteFilter("tetr.io chinese font replacer", "https://tetr.io/res/font/hun.fnt", {
        enabledFor: async (storage) => {
            let res = await storage.get(pluginStateStorageKey);
            return res[pluginStateStorageKey];
        },
        onStart: async (storage, url, src, callback) => {
            callback({
                type: "font/fnt",
                data: await processPlacement(replacements["res/font/hun.fnt"], [{ src, storage }]),
                encoding: "arraybuffer",
            });
        },
    });

    createRewriteFilter("tetr.io chinese font replacer", "https://tetr.io/res/font/hun.png", {
        enabledFor: async (storage) => {
            let res = await storage.get(pluginStateStorageKey);
            return res[pluginStateStorageKey];
        },
        onStart: async (storage, url, src, callback) => {
            callback({
                type: "image/png",
                data: await processPlacement(replacements["res/font/hun.png"], [{ src, storage }]),
                encoding: "arraybuffer",
            });
        },
    });

    createRewriteFilter("tetr.io chinese script replace", "https://tetr.io/js/tetrio.js*", {
        enabledFor: async (storage) => {
            let res = await storage.get(pluginStateStorageKey);
            return res[pluginStateStorageKey];
        },
        onStop: async (storage, _url, src, callback) => {
            callback({
                type: "text/javascript",
                data: await processPlacement(replacements["/js/tetrio.js"], [{ src, storage }]),
                encoding: "arraybuffer",
            });
        },
    });
};