// @ts-nocheck

import {isNullish, mergeAll} from "remeda";
import hun_fnt_base64 from '@/assets/hun/hun.fnt?base64'
import hun_png_base64 from '@/assets/hun/hun.png?base64'
import {log} from "@/utils/logging";
import {unsafeWindow} from "vite-plugin-monkey/dist/client";

const replacements = {
    'res/font/hun.fnt': 'data:font/fnt;base64,' + hun_fnt_base64,
    'res/font/hun.png': 'data:image/png;base64,' + hun_png_base64,
    '/js/tetrio.js': async (src: string | null = null) => {
        if (isNullish(src)) {
            const response = await fetch("/js/tetrio.js");
            src = await response.text();
        }

        const zenithPromptMap = mergeAll(
            Object.values(
                import.meta.glob<[]>('@/translates/zenithPromptMap/*.json', {
                    import: 'default',
                    eager: true
                })
            )
        )

        return src.replace(/zenith.ns.zenithprompts(.*?)update\(e\){/gi, `zenith.ns.zenithprompts$1update(e) { const _replaceTexts = ${JSON.stringify(zenithPromptMap)}; e = e.map(item => { if (_replaceTexts[item.label] !== undefined) { item.label = _replaceTexts[item.label]; } return item; });`,);
    }
}

const monkey = async () => {
    const {open: XMLHttpRequestOpen, send: XMLHttpRequestSend} = unsafeWindow.XMLHttpRequest.prototype;

    const until = async (checker) => {
        while (true) {
            const check = checker();

            await new Promise((resolve) => {
                setTimeout(async () => {
                    resolve();
                }, 0);
            });

            if (check) {
                break;
            }
        }
    };

    const _XMLHttpRequest = unsafeWindow.XMLHttpRequest

    unsafeWindow.XMLHttpRequest.prototype.send = function (...args) {
        log("xhr.open", this, args);

        if (this._hooked) {
            const _callback = this.onload;

            this.onload = async (...args) => {
                const urlWithoutQuery = this._url.split("?", 2)[0];

                if (urlWithoutQuery !== undefined) {
                    let raw = null;

                    if (replacements[urlWithoutQuery] !== undefined) {
                        if (typeof replacements[urlWithoutQuery] === "string") {
                            raw = await fetch(replacements[urlWithoutQuery]).then(async (response) => {
                                return await response.text();
                            });
                        }

                        if (typeof replacements[urlWithoutQuery] === "function") {
                            raw = await replacements[urlWithoutQuery]();
                        }
                    }

                    log("xhr:hooked", this, urlWithoutQuery, replacements[urlWithoutQuery], raw);

                    if (raw !== null) {
                        Object.defineProperty(this, "response", {
                            value: raw,
                            writable: false,
                        });

                        Object.defineProperty(this, "responseText", {
                            value: raw,
                            writable: false,
                        });
                    }
                }

                await _callback.call(this, ...args);
            };
        }

        return XMLHttpRequestSend.call(this, ...args);
    };

    unsafeWindow.XMLHttpRequest.prototype.open = function (...args) {
        log("xhr.open", this, args);

        this._method = args[0];
        this._url = args[1];
        this._async = args[2];

        const urlWithoutQuery = this._url.split("?", 2)[0];

        if (urlWithoutQuery !== undefined) {
            if (replacements[urlWithoutQuery] !== undefined) {
                this._hooked = true;
                args[1] = "data:application/octet-stream;base64,IldPU0hJWkhBWkhBMTIwIg==";
                log("xhr.open:hooked", ...args);
            }
        }

        return XMLHttpRequestOpen.call(this, ...args);
    };

    unsafeWindow.Image = new Proxy(unsafeWindow.Image, {
        construct(target, args, newTarget) {
            const instance = Reflect.construct(target, args, newTarget);
            log("new Image", target, args, newTarget, instance);

            until(async () => {
                return instance.getAttribute("src") !== null;
            }).then(async () => {
                const src = instance.getAttribute("src");
                log("Image.src:changed", src);

                if (replacements[src] !== undefined) {
                    log("Image:hooked", src, replacements[src]);
                    instance.setAttribute("src", replacements[src]);
                }
            });

            return instance;
        },
    });
}

const electron = async () => {
    createRewriteFilter('tetr.io chinese font replacer', 'https://tetr.io/res/font/*', {
        enabledFor: async () => {
            return true;
        },
        onStop: async (_storage, url, _src, callback) => {
            if (url.endsWith('hun.fnt')) {
                callback({
                    type: 'font/fnt',
                    data: replacements['res/font/hun.fnt'],
                    encoding: 'base64-data-url'
                });

                return
            }

            if (url.endsWith('hun.png')) {
                callback({
                    type: 'image/png',
                    data: replacements['res/font/hun.png'],
                    encoding: 'base64-data-url'
                });

                return
            }
        }
    })

    createRewriteFilter('tetr.io chinese script replace', 'https://tetr.io/js/tetrio.js*', {
        enabledFor: async () => {
            return true;
        },
        onStop: async (_storage, _url, src, callback) => {
            callback({
                type: 'text/javascript',
                data: await replacements['/js/tetrio.js'](src),
                encoding: 'text'
            });
        }
    })
}

export default {monkey, electron}