import inGameTranslator from "@/modules/inGameTranslator-monkey";
import translator from "@/modules/translator";

await inGameTranslator();

window.addEventListener(
    "load",
    async () => {
        await translator();
    },
    {
        once: true,
    },
);