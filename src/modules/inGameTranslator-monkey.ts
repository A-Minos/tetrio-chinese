// @ts-nocheck

import { log } from "@/utils/logging";
import { replacements } from "@/modules/inGameTranslator";
import { processPlacement } from "@/utils/replacement.ts";
import { isArray, isNonNullish } from "remeda";
import { GM_getValue, GM_setValue, unsafeWindow } from "$";

export default async () => {
    const storage = {
        get(names) {
            if (!isArray(names)) {
                names = [names];
            }

            return Object.fromEntries(
                names.map((name) => {
                    return [name, GM_getValue(name)];
                }),
            );
        },
        set(map) {
            Object.entries(map).forEach(([key, value]) => {
                GM_setValue(key, value);
            });
        },
    };

    const { open: XMLHttpRequestOpen, send: XMLHttpRequestSend } = unsafeWindow.XMLHttpRequest.prototype;

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

    unsafeWindow.XMLHttpRequest.prototype.send = function (...args) {
        log("xhr.open", this, args);

        if (this._hooked) {
            const _callback = this.onload;

            this.onload = async (...args) => {
                const urlWithoutQuery = this._url.split("?", 2)[0];

                if (isNonNullish(urlWithoutQuery) && isNonNullish(replacements[urlWithoutQuery])) {
                    const processed = await processPlacement(replacements[urlWithoutQuery], [{ storage }]);

                    log("xhr:hooked", this, urlWithoutQuery, replacements[urlWithoutQuery], processed);

                    if (isNonNullish(processed)) {
                        Object.defineProperty(this, "response", {
                            value: processed,
                            writable: false,
                        });

                        Object.defineProperty(this, "responseText", {
                            value: processed,
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

        if (isNonNullish(urlWithoutQuery)) {
            if (isNonNullish(replacements[urlWithoutQuery])) {
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
                return isNonNullish(instance.getAttribute("src"));
            }).then(async () => {
                const src = instance.getAttribute("src");
                log("Image.src:changed", src);

                if (isNonNullish(replacements[src])) {
                    const processed = await processPlacement(replacements[src], [{ storage }]);

                    if (isNonNullish(processed)) {
                        log("Image:hooked", src, processed);
                        instance.setAttribute("src", processed);
                    }
                }
            });

            return instance;
        },
    });
};