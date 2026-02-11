# Changelog

Tutte le modifiche importanti del progetto sono documentate in questo file.

## [4.0.0] - 2026-02-11

### Added
- Aggiunto file `VERSION` con versione corrente del rilascio.
- Aggiunti file di governance progetto: `SOFTWARE_REPORT.md`, `ROADMAP.md` e `docs/DEPENDENCIES.md`.
- Aggiunto `.gitignore` con esclusione di directory di dipendenze, build e runtime.

### Changed
- Riscrittura completa di `fuckadblock.js` con struttura più modulare e commentata.
- Aggiornato `README.md` con documentazione allineata alla nuova release 4.0.0.
- Aggiornati `package.json` e `bower.json` alla versione `4.0.0`.

### Fixed
- Migliorata la gestione del bait DOM in creazione/rimozione per ridurre errori in stati limite.
- Corretto il flusso interno di check per rendere più prevedibile l'uscita dal loop.

### Removed
- Rimosse formulazioni obsolete nella documentazione precedente.
