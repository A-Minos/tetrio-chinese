import inGameTranslator from '@/modules/inGameTranslator'
import translator from '@/modules/translator'

await inGameTranslator.monkey()

window.addEventListener('load', async () => {
    await translator()
}, {
    once: true
})