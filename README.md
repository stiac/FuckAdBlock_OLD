# FuckAdBlock (v4.0.0)

Libreria JavaScript standalone per rilevare ad blocker nel browser, senza dipendenze esterne e senza build step.

## Versione corrente
- **4.0.0**

## Novità principali della 4.0.0
- Riscrittura completa di `fuckadblock.js` mantenendo la compatibilità dell'API pubblica.
- Migliore robustezza in fase di creazione/rimozione del bait DOM.
- Migliore leggibilità grazie a codice modulare e commentato.
- Mantenuto alias `_creatBait` per retrocompatibilità.

## Requisiti
- Browser con supporto JavaScript (inclusi ambienti legacy compatibili con `attachEvent`).
- Nessuna dipendenza npm/bower obbligatoria per il runtime.

## Installazione
### NPM
```bash
npm install fuckadblock
```

### Bower
```bash
bower install fuckadblock
```

### Script diretto
```html
<script src="./fuckadblock.js"></script>
```

## Utilizzo rapido
```html
<script src="./fuckadblock.js"></script>
<script>
  function adBlockDetected() {
    console.log('AdBlock rilevato');
  }

  function adBlockNotDetected() {
    console.log('AdBlock non rilevato');
  }

  fuckAdBlock.onDetected(adBlockDetected);
  fuckAdBlock.onNotDetected(adBlockNotDetected);
  fuckAdBlock.check();
</script>
```

## API pubblica
- `setOption(options, value)`
- `check(loop)`
- `emitEvent(detected)`
- `clearEvent()`
- `on(detected, fn)`
- `onDetected(fn)`
- `onNotDetected(fn)`

## Opzioni di default
```js
{
  checkOnLoad: false,
  resetOnEnd: false,
  loopCheckTime: 50,
  loopMaxNumber: 5,
  baitClass: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links',
  baitStyle: 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;',
  debug: false
}
```

## Note di compatibilità
- L'istanza globale `fuckAdBlock` viene creata automaticamente se non già definita.
- La classe costruttore globale `FuckAdBlock` resta disponibile.
- L'API è orientata alla retrocompatibilità con la serie 3.x.

## Licenza
MIT (vedi file `LICENSE`).
