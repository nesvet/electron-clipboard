import type Electron from "electron";


export class Clipboard {
	constructor(ipcMain: Electron.IpcMain, handlers: {
		set: typeof Clipboard["defaultHandleSet"];
		get: typeof Clipboard["defaultHandleGet"];
		has: typeof Clipboard["defaultHandleHas"];
	}) {
		
		if (handlers) {
			ipcMain.handle("clipboard:set", handlers.set);
			ipcMain.handle("clipboard:get", handlers.get);
			ipcMain.handle("clipboard:has", handlers.has);
		} else {
			this.#map = new Map();
			ipcMain.handle("clipboard:set", Clipboard.defaultHandleSet.bind(this));
			ipcMain.handle("clipboard:get", Clipboard.defaultHandleGet.bind(this));
			ipcMain.handle("clipboard:has", Clipboard.defaultHandleHas.bind(this));
		}
		
	}
	
	#map;
	
	
	/** @this Clipboard */
	static defaultHandleSet(this: Clipboard, event: Electron.IpcMainInvokeEvent, name: string, contents: unknown) {
		return this.#map!.set(name, contents);
	}
	
	/** @this Clipboard */
	static defaultHandleGet(this: Clipboard, event: Electron.IpcMainInvokeEvent, name: string) {
		return this.#map!.get(name);
	}
	
	/** @this Clipboard */
	static defaultHandleHas(this: Clipboard, event: Electron.IpcMainInvokeEvent, name: string) {
		return this.#map!.has(name);
	}
	
}
