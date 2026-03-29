import inGameTranslator from "@/modules/inGameTranslator-monkey";
import translator from "@/modules/translator";
import { unsafeWindow } from "$";

(async () => {
    unsafeWindow.addEventListener(
        "load",
        async () => {
            await translator();
        },
        {
            once: true,
        },
    );

    await inGameTranslator();
})();