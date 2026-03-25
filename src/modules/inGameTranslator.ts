// @ts-nocheck

import { isNullish, mergeAll } from "remeda";
import hun_fnt_base64 from "@/assets/hun/hun.fnt?base64";
import hun_png_base64 from "@/assets/hun/hun.png?base64";

export const replacements = {
    "res/font/hun.fnt": "data:font/fnt;base64," + hun_fnt_base64,
    "res/font/hun.png": "data:image/png;base64," + hun_png_base64,
    "/js/tetrio.js": async (src: string | null = null) => {
        if (isNullish(src)) {
            const response = await fetch("/js/tetrio.js");
            src = await response.text();
        }

        const zenithPromptMap = mergeAll(
            Object.values(
                import.meta.glob<[]>("@/translates/zenithPromptMap/*.json", {
                    import: "default",
                    eager: true,
                }),
            ),
        );

        return src.replace(
            /zenith.ns.zenithprompts(.*?)update\(e\){/gi,
            `zenith.ns.zenithprompts$1update(e) { const _replaceTexts = ${JSON.stringify(zenithPromptMap)}; e = e.map(item => { if (_replaceTexts[item.label] !== undefined) { item.label = _replaceTexts[item.label]; } return item; });`,
        );
    },
};