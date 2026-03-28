import inGameTranslator from "@/modules/inGameTranslator-monkey";
import translator from "@/modules/translator";

(async () => {
    window.addEventListener(
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