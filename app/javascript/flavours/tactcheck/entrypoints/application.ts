import 'flavours/tactcheck/gamepatch/card.css';

import { loadLocale } from 'flavours/glitch/locales';
import main from 'flavours/glitch/main';
import { loadPolyfills } from 'flavours/glitch/polyfills';
import { ensureGamepatchCard } from 'flavours/tactcheck/gamepatch/card_runtime';

ensureGamepatchCard();

loadPolyfills()
  .then(loadLocale)
  .then(main)
  .catch((e: unknown) => {
    console.error(e);
  });
