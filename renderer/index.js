export class Clipboard {
	constructor(ipcRenderer, name, { makeId, links, copy, cut, paste, drain }) {
		this.#ipcRenderer = ipcRenderer;
		this.#name = name;
		this.#makeId = makeId;
		this.#links = links || [];
		this.#handleCopy = copy || pass;
		this.#handleCut = cut;
		this.#handlePaste = paste || pass;
		this.#handleDrain = drain;
		
		this.#ipcRenderer.invoke("clipboard:has", this.#name).then(isNotEmpty => (this.isEmpty = !isNotEmpty));
		
	}
	
	#ipcRenderer;
	#name;
	#makeId;
	#links;
	#handleCopy;
	#handleCut;
	#handlePaste;
	#handleDrain;
	
	isEmpty = true;
	
	#drain(items) {
		const array =
			Array.isArray(items) ?
				items :
				Object.values(items).flat();
		
		let i = 0;
		const idMap = new Map();
		
		for (const item of array) {
			const _id = (i++).toString(36);
			idMap.set(item._id, _id);
			if (this.#handleDrain?.(item, _id) === false)
				continue;
			item._id = _id;
			delete item.createdAt;
			delete item.modifiedAt;
		}
		
		for (const field of this.#links)
			for (const item of array)
				if (item[field])
					item[field] =
						Array.isArray(item[field]) ?
							item[field].map(key => idMap.get(key)) :
							idMap.get(item[field]);
		
		return items;
	}
	
	copyDrained(drainedData) {
		this.#ipcRenderer.invoke("clipboard:set", this.#name, JSON.stringify(drainedData));
		this.isEmpty = false;
		
		return drainedData;
	}
	
	drain(data) {
		return this.#drain(this.#handleCopy(data));
	}
	
	copy(data) {
		return this.copyDrained(this.drain(data));
	}
	
	cut(data) {
		return this.#handleCut?.(data, this.copy(data));
	}
	
	async get() {
		
		const data = await this.#ipcRenderer.invoke("clipboard:get", this.#name);
		if (data !== undefined)
			return JSON.parse(data);
	}
	
	async has() {
		return await this.#ipcRenderer.invoke("clipboard:has", this.#name);
	}
	
	#hydrate(items) {
		
		const idMap = new Map();
		
		if (Array.isArray(items))
			for (const item of items) {
				const _id = this.#makeId(item);
				idMap.set(item._id, _id);
				item._id = _id;
			}
		else
			for (const key in items) {
				const makeId = this.#makeId[key];
				for (const item of items[key]) {
					const _id = makeId(item);
					idMap.set(item._id, _id);
					item._id = _id;
				}
			}
		
		if (this.#links.length) {
			const array = Array.isArray(items) ? items : Object.values(items).flat();
			for (const field of this.#links)
				for (const item of array)
					if (item[field])
						item[field] =
							Array.isArray(item[field]) ?
								item[field].map(key => idMap.get(key)) :
								idMap.get(item[field]);
		}
		
		return items;
	}
	
	async paste(...args) {
		return this.#handlePaste(this.#hydrate(await this.get()), ...args);
	}
	
}
