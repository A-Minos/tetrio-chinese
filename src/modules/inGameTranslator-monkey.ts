// @ts-nocheck

import { log } from "@/utils/logging";
import { replacements } from "@/modules/inGameTranslator";

export default async () => {
    const { open: XMLHttpRequestOpen, send: XMLHttpRequestSend } = $.unsafeWindow.XMLHttpRequest.prototype;

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

    const _XMLHttpRequest = unsafeWindow.XMLHttpRequest;

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
};