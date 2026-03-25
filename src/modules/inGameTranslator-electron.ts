// @ts-nocheck

import { replacements } from "@/modules/inGameTranslator";

export default async () => {
    const pluginStateStorageKey = "tetrio_plus_plus_customize-chinese_translate-state";

    createRewriteFilter("tetr.io chinese font replacer", "https://tetr.io/res/font/*", {
        enabledFor: async (storage) => {
            let res = await storage.get(pluginStateStorageKey);
            return res[pluginStateStorageKey];
        },
        onStop: async (_storage, url, _src, callback) => {
            if (url.endsWith("hun.fnt")) {
                callback({
                    type: "font/fnt",
                    data: replacements["res/font/hun.fnt"],
                    encoding: "base64-data-url",
                });

                return;
            }

            if (url.endsWith("hun.png")) {
                callback({
                    type: "image/png",
                    data: replacements["res/font/hun.png"],
                    encoding: "base64-data-url",
                });

                return;
            }
        },
    });

    createRewriteFilter("tetr.io chinese script replace", "https://tetr.io/js/tetrio.js*", {
        enabledFor: async (storage) => {
            let res = await storage.get(pluginStateStorageKey);
            return res[pluginStateStorageKey];
        },
        onStop: async (_storage, _url, src, callback) => {
            callback({
                type: "text/javascript",
                data: await replacements["/js/tetrio.js"](src),
                encoding: "text",
            });
        },
    });
};