// @ts-nocheck

import "@/patchs/URL";
import { isNonNullish, isNullish, mergeAll, unique } from "remeda";
import init, { build_font, import_bmfont, merge_fonts } from "@a-minos/fontbake-wasm";
import font from "@/assets/zpix.ttf?url";
import { log } from "@/utils/logging.ts";

export const replacements = {
    ...(() => {
        const cacheStorageKey = "chineseCache";

        let resolvePng = null;
        const png = new Promise<string>((resolve) => {
            resolvePng = resolve;
        });

        return {
            "res/font/hun.fnt": async ({ storage }) => {
                const chars = unique(
                    Object.values(
                        mergeAll(
                            Object.values(
                                import.meta.glob<[]>("@/translates/zenithPromptMap/*.json", {
                                    import: "default",
                                    eager: true,
                                }),
                            ),
                        ),
                    )
                        .flat()
                        .join(""),
                ).join("");

                log("ingame", "字符集", chars);

                if (isNonNullish(storage)) {
                    const res = await storage.get([cacheStorageKey, "font_hun_fnt", "font_hun_png"]);

                    const decode = async (data) => {
                        if (typeof Buffer !== "undefined") {
                            return new Uint8Array(Buffer.from(data, "base64"));
                        }

                        const binary = atob(data);
                        const bytes = new Uint8Array(binary.length);

                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }

                        return bytes;
                    };

                    const chineseCache = res[cacheStorageKey];

                    if (isNonNullish(chineseCache) && customNoChange) {
                        const shouldUseCache = () => {
                            if (isNonNullish(res.font_hun_fnt) && chineseCache.custom_fnt !== res.font_hun_fnt) {
                                return false;
                            }

                            if (isNonNullish(res.font_hun_png) && chineseCache.custom_png !== res.font_hun_png) {
                                return false;
                            }

                            return chineseCache.chars === chars;
                        };

                        if (shouldUseCache()) {
                            log("ingame", "返回缓存");

                            const cached = await decode(chineseCache.png);

                            resolvePng(cached);

                            return new TextEncoder().encode(chineseCache.fnt);
                        }
                    }
                }

                await init();

                log("ingame", "下载字体");

                const res = isNonNullish(storage) ? await storage.get(["font_hun_fnt", "font_hun_png"]) : {};

                const fnt = await (await fetch(res.font_hun_fnt ?? "https://tetr.io/res/font/hun.fnt")).text();
                const png = await (await fetch(res.font_hun_png ?? "https://tetr.io/res/font/hun.png")).bytes();

                log("ingame", "下载字体完成");
                log("ingame", "导入字体");

                const imported = import_bmfont(fnt, JSON.stringify([[...png]]), "tetrio chinese");

                log("ingame", "导入字体完成");

                log("ingame", "构建字体");

                const build = build_font(
                    `font.name=HUN\nfont.size=52\nfont.bold=false\nfont.italic=false\nfont.gamma=1.8\nfont.mono=false\npad.top=4\npad.right=4\npad.bottom=4\npad.left=4\npad.advance.x=-8\npad.advance.y=-8\nglyph.native.rendering=false\nglyph.page.width=1024\nglyph.page.height=1024\nglyph.text=${chars}\nrender_type=0\neffect.class=com.badlogic.gdx.tools.hiero.unicodefont.effects.DistanceFieldEffect\neffect.Color=ffffff\neffect.Scale=32\neffect.Spread=3.5`,
                    [...(await (await fetch(font)).bytes())],
                    JSON.stringify([]),
                );

                log("ingame", "构建字体完成");

                log("ingame", "合并字体");

                const merged = merge_fonts(
                    JSON.stringify([JSON.parse(imported.glyphs_json), JSON.parse(build.glyphs_json)]),
                    JSON.stringify({
                        face: "HUN2",
                        font_size: 52,
                        line_height: 52,
                        base: 40,
                        page_width: 1024,
                        page_height: 1024,
                        padding: [4, 4, 4, 4],
                        spacing: [-8, -8],
                    }),
                );

                log("ingame", "合并字体完成");

                const mergedFnt = merged.fnt_text.replace('file="HUN2.png"', 'file="hun.png"');

                const mergedPngBuffer = new Uint8Array(merged.page_pngs[0]);

                if (isNonNullish(storage)) {
                    const encode = async (buffer) => {
                        if (typeof Buffer !== "undefined") {
                            return Buffer.from(buffer).toString("base64");
                        }

                        const chunkSize = 0x8000;

                        let binary = "";
                        for (let i = 0; i < buffer.length; i += chunkSize) {
                            binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
                        }

                        return btoa(binary);
                    };

                    log("ingame", "写入缓存");

                    await storage.set({
                        [cacheStorageKey]: {
                            chars,
                            custom_fnt: res.font_hun_fnt,
                            custom_png: res.font_hun_png,
                            fnt: mergedFnt,
                            png: await encode(mergedPngBuffer),
                        },
                    });
                }

                if (isNonNullish(resolvePng)) {
                    resolvePng(mergedPngBuffer);
                }

                return new TextEncoder().encode(mergedFnt);
            },
            "res/font/hun.png": async () => {
                return await png;
            },
        };
    })(),
    "/js/tetrio.js": async ({ src }) => {
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

        const raw = src.replace(
            /zenith.ns.zenithprompts(.*?)update\(e\){/gi,
            `zenith.ns.zenithprompts$1update(e) { const _replaceTexts = ${JSON.stringify(zenithPromptMap)}; e = e.map(item => { if (_replaceTexts[item.label] !== undefined) { item.label = _replaceTexts[item.label]; } return item; });`,
        );

        return new TextEncoder().encode(raw);
    },
};