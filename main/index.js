export class Clipboard {
	constructor(ipcMain, handlers) {
		if (handlers) {
			const { set, get, has } = handlers;
			this.#handleSet = set;
			this.#handleGet = get;
			this.#handleHas = has;
		} else {
			this.#map = new Map();
			this.#handleSet = Clipboard.handleSet.bind(this);
			this.#handleGet = Clipboard.handleGet.bind(this);
			this.#handleHas = Clipboard.handleHas.bind(this);
		}
		
		ipcMain.handle("clipboard:set", this.#handleSet);
		ipcMain.handle("clipboard:get", this.#handleGet);
		ipcMain.handle("clipboard:has", this.#handleHas);
		
	}
	
	#map;
	#handleSet;
	#handleGet;
	#handleHas;
	
	/** @this Clipboard */
	static handleSet(name, contents) {
		return this.#map.set(name, contents);
	}
	
	/** @this Clipboard */
	static handleGet(name) {
		return this.#map.get(name);
	}
	
	/** @this Clipboard */
	static handleHas(name) {
		return this.#map.has(name);
	}
	
}
