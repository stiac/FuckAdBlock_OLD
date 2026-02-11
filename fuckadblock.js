/*
 * FuckAdBlock 4.0.0
 * Copyright (c) 2015-2026 Valentin Allaire and contributors
 * Released under the MIT license
 * https://github.com/sitexw/FuckAdBlock
 */

(function attachFuckAdBlock(globalScope) {
	'use strict';

	if (!globalScope || !globalScope.document) {
		return;
	}

	var DEFAULT_OPTIONS = {
		checkOnLoad: false,
		resetOnEnd: false,
		loopCheckTime: 50,
		loopMaxNumber: 5,
		baitClass: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links',
		baitStyle: 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;',
		debug: false
	};

	/**
	 * Constructor principale.
	 * Mantiene la stessa API storica ma con una base più robusta,
	 * commentata e facilmente estendibile.
	 */
	function FuckAdBlock(options) {
		this._options = cloneOptions(DEFAULT_OPTIONS);
		this._var = {
			version: '4.0.0',
			bait: null,
			checking: false,
			loop: null,
			loopNumber: 0,
			event: {
				detected: [],
				notDetected: []
			}
		};

		if (options !== undefined && options !== null) {
			this.setOption(options);
		}

		bindOnLoadCheck(this);
	}

	/**
	 * Log interno in modalità debug.
	 */
	FuckAdBlock.prototype._log = function _log(method, message) {
		if (globalScope.console && typeof globalScope.console.log === 'function') {
			globalScope.console.log('[FuckAdBlock][' + method + '] ' + message);
		}
	};

	/**
	 * Imposta una o più opzioni.
	 * Supporta sia setOption('chiave', valore) sia setOption({ ... }).
	 */
	FuckAdBlock.prototype.setOption = function setOption(options, value) {
		var payload = options;

		if (value !== undefined) {
			payload = {};
			payload[options] = value;
		}

		if (!payload || typeof payload !== 'object') {
			return this;
		}

		for (var option in payload) {
			if (Object.prototype.hasOwnProperty.call(payload, option)) {
				this._options[option] = payload[option];
				if (this._options.debug) {
					this._log('setOption', 'Option "' + option + '" impostata a "' + payload[option] + '"');
				}
			}
		}

		return this;
	};

	/**
	 * Crea il bait HTML usato per verificare il blocco pubblicità.
	 */
	FuckAdBlock.prototype._createBait = function _createBait() {
		var body = getBody();
		if (!body) {
			return false;
		}

		if (this._var.bait) {
			return true;
		}

		var bait = globalScope.document.createElement('div');
		bait.setAttribute('class', this._options.baitClass);
		bait.setAttribute('style', this._options.baitStyle);
		bait.setAttribute('aria-hidden', 'true');

		this._var.bait = body.appendChild(bait);
		forceLayoutRead(this._var.bait);

		if (this._options.debug) {
			this._log('_createBait', 'Bait creato correttamente');
		}

		return true;
	};

	/**
	 * Alias mantenuto per retrocompatibilità con vecchie integrazioni.
	 */
	FuckAdBlock.prototype._creatBait = FuckAdBlock.prototype._createBait;

	/**
	 * Elimina il bait dal DOM se presente.
	 */
	FuckAdBlock.prototype._destroyBait = function _destroyBait() {
		if (!this._var.bait) {
			return;
		}

		if (this._var.bait.parentNode) {
			this._var.bait.parentNode.removeChild(this._var.bait);
		}
		this._var.bait = null;

		if (this._options.debug) {
			this._log('_destroyBait', 'Bait rimosso');
		}
	};

	/**
	 * Avvia un controllo anti-adblock.
	 * Restituisce false solo se è già in corso una verifica.
	 */
	FuckAdBlock.prototype.check = function check(loop) {
		var shouldLoop = loop !== undefined ? !!loop : true;

		if (this._options.debug) {
			this._log('check', 'Controllo richiesto ' + (shouldLoop ? 'con loop' : 'senza loop'));
		}

		if (this._var.checking) {
			if (this._options.debug) {
				this._log('check', 'Controllo annullato: verifica già in corso');
			}
			return false;
		}

		this._var.checking = true;
		this._var.loopNumber = 0;

		if (!this._createBait()) {
			// Se il body non è ancora pronto, consideriamo il controllo fallito in sicurezza.
			this._var.checking = false;
			return false;
		}

		var self = this;
		if (shouldLoop) {
			this._var.loop = globalScope.setInterval(function loopCheck() {
				self._checkBait(shouldLoop);
			}, this._options.loopCheckTime);
		}

		globalScope.setTimeout(function firstCheck() {
			self._checkBait(shouldLoop);
		}, 1);

		return true;
	};

	/**
	 * Core detection: valuta i segnali tipici di ad blocker.
	 */
	FuckAdBlock.prototype._checkBait = function _checkBait(loop) {
		var detected = false;

		if (!this._var.bait && !this._createBait()) {
			this._stopLoop();
			this._var.checking = false;
			return;
		}

		var bait = this._var.bait;
		if (
			globalScope.document.body.getAttribute('abp') !== null ||
			bait.offsetParent === null ||
			bait.offsetHeight === 0 ||
			bait.offsetLeft === 0 ||
			bait.offsetTop === 0 ||
			bait.offsetWidth === 0 ||
			bait.clientHeight === 0 ||
			bait.clientWidth === 0
		) {
			detected = true;
		}

		if (typeof globalScope.getComputedStyle === 'function') {
			var baitStyle = globalScope.getComputedStyle(bait, null);
			if (
				baitStyle &&
				(baitStyle.getPropertyValue('display') === 'none' || baitStyle.getPropertyValue('visibility') === 'hidden')
			) {
				detected = true;
			}
		}

		if (this._options.debug) {
			this._log(
				'_checkBait',
				'Check #' +
					(this._var.loopNumber + 1) +
					'/' +
					this._options.loopMaxNumber +
					' => detection ' +
					(detected ? 'positiva' : 'negativa')
			);
		}

		if (loop) {
			this._var.loopNumber += 1;
			if (this._var.loopNumber >= this._options.loopMaxNumber) {
				this._stopLoop();
			}
		}

		if (detected) {
			this._stopLoop();
			this._destroyBait();
			this.emitEvent(true);
			this._var.checking = false;
			return;
		}

		if (this._var.loop === null || !loop) {
			this._destroyBait();
			this.emitEvent(false);
			this._var.checking = false;
		}
	};

	/**
	 * Arresta il loop periodico di verifica.
	 */
	FuckAdBlock.prototype._stopLoop = function _stopLoop() {
		if (this._var.loop !== null) {
			globalScope.clearInterval(this._var.loop);
		}
		this._var.loop = null;
		this._var.loopNumber = 0;

		if (this._options.debug) {
			this._log('_stopLoop', 'Loop di controllo arrestato');
		}
	};

	/**
	 * Emette gli handler registrati.
	 */
	FuckAdBlock.prototype.emitEvent = function emitEvent(detected) {
		var eventName = detected ? 'detected' : 'notDetected';
		var handlers = this._var.event[eventName] || [];

		if (this._options.debug) {
			this._log('emitEvent', 'Emissione evento "' + eventName + '" con ' + handlers.length + ' handler');
		}

		for (var i = 0; i < handlers.length; i += 1) {
			if (typeof handlers[i] === 'function') {
				handlers[i]();
			}
		}

		if (this._options.resetOnEnd) {
			this.clearEvent();
		}

		return this;
	};

	/**
	 * Pulisce tutti gli handler registrati.
	 */
	FuckAdBlock.prototype.clearEvent = function clearEvent() {
		this._var.event.detected = [];
		this._var.event.notDetected = [];

		if (this._options.debug) {
			this._log('clearEvent', 'Tutti gli eventi sono stati rimossi');
		}

		return this;
	};

	/**
	 * Registra un callback su detection positiva/negativa.
	 */
	FuckAdBlock.prototype.on = function on(detected, fn) {
		if (typeof fn === 'function') {
			this._var.event[detected ? 'detected' : 'notDetected'].push(fn);
			if (this._options.debug) {
				this._log('on', 'Registrato handler per evento "' + (detected ? 'detected' : 'notDetected') + '"');
			}
		}
		return this;
	};

	FuckAdBlock.prototype.onDetected = function onDetected(fn) {
		return this.on(true, fn);
	};

	FuckAdBlock.prototype.onNotDetected = function onNotDetected(fn) {
		return this.on(false, fn);
	};

	/**
	 * Utility: clonazione opzioni (solo proprietà own).
	 */
	function cloneOptions(source) {
		var target = {};
		for (var key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				target[key] = source[key];
			}
		}
		return target;
	}

	/**
	 * Utility: ottiene il body se disponibile.
	 */
	function getBody() {
		return globalScope.document && globalScope.document.body ? globalScope.document.body : null;
	}

	/**
	 * Utility: forza una lettura layout per triggerare eventuali hook di blocco.
	 */
	function forceLayoutRead(bait) {
		bait.offsetParent;
		bait.offsetHeight;
		bait.offsetLeft;
		bait.offsetTop;
		bait.offsetWidth;
		bait.clientHeight;
		bait.clientWidth;
	}

	/**
	 * Collega il check su load se richiesto da configurazione.
	 */
	function bindOnLoadCheck(instance) {
		var runCheck = function runCheck() {
			globalScope.setTimeout(function deferredCheck() {
				if (!instance._options.checkOnLoad) {
					return;
				}
				instance.check();
			}, 1);
		};

		if (typeof globalScope.addEventListener === 'function') {
			globalScope.addEventListener('load', runCheck, false);
		} else if (typeof globalScope.attachEvent === 'function') {
			globalScope.attachEvent('onload', runCheck);
		}
	}

	globalScope.FuckAdBlock = FuckAdBlock;

	if (globalScope.fuckAdBlock === undefined) {
		globalScope.fuckAdBlock = new FuckAdBlock({
			checkOnLoad: true,
			resetOnEnd: true
		});
	}
})(window);
