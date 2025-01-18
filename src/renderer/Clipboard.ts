import type Electron from "electron";
import type {
	DrainedItems,
	Item,
	ItemId,
	Items,
	ItemsArrayMakeId,
	ItemsObjectMapMakeId,
	MakeId
} from "./types";


export class Clipboard {
	constructor(
		ipcRenderer: Electron.IpcRenderer,
		name: string,
		{ makeId, links, copy, cut, paste, drain }: {
			makeId: MakeId;
			links: string[];
			copy: (items: Items) => Items;
			cut: (items: Items, drainedItems: DrainedItems) => Items;
			paste: (items: Items, ...args: unknown[]) => Items;
			drain: (item: Item, _id: ItemId) => boolean | undefined;
		}
	) {
		this.#ipcRenderer = ipcRenderer;
		this.#name = name;
		this.#makeId = makeId;
		this.#links = links || [];
		this.#handleCopy = copy || ((items: Items) => items);
		this.#handleCut = cut;
		this.#handlePaste = paste || ((items: Items, ..._args: unknown[]) => items);
		this.#handleDrain = drain;
		
		this.#ipcRenderer.invoke("clipboard:has", this.#name).then(isNotEmpty => { this.isEmpty = !isNotEmpty; });
		
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
	
	#drain(items: Items) {
		const array =
			Array.isArray(items) ?
				items :
				Object.values(items).flat();
		
		let i = 0;
		const idMap = new Map<ItemId, ItemId>();
		
		for (const item of array) {
			const _id = (i++).toString(36) as ItemId;
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
							idMap.get(item[field] as ItemId);
		
		return items as DrainedItems;
	}
	
	copyDrained(drainedItems: DrainedItems): DrainedItems {
		this.#ipcRenderer.invoke("clipboard:set", this.#name, JSON.stringify(drainedItems));
		this.isEmpty = false;
		
		return drainedItems;
	}
	
	drain(items: Items): DrainedItems {
		return this.#drain(this.#handleCopy(items));
	}
	
	copy(items: Items): DrainedItems {
		return this.copyDrained(this.drain(items));
	}
	
	cut(items: Items): Items {
		return this.#handleCut?.(items, this.copy(items));
	}
	
	async get() {
		
		const itemsString = await this.#ipcRenderer.invoke("clipboard:get", this.#name) as string | undefined;
		
		return itemsString ? JSON.parse(itemsString) as Items : null;
	}
	
	async has() {
		return await this.#ipcRenderer.invoke("clipboard:has", this.#name);
	}
	
	#hydrate(items: Items) {
		
		const idMap = new Map();
		
		if (Array.isArray(items))
			for (const item of items) {
				const _id = (this.#makeId as ItemsArrayMakeId)(item);
				idMap.set(item._id, _id);
				item._id = _id;
			}
		else
			for (const key of Object.keys(items)) {
				const makeId = (this.#makeId as ItemsObjectMapMakeId)[key];
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
	
	async paste(...args: unknown[]) {
		const items = await this.get();
		
		return items ? this.#handlePaste(this.#hydrate(items), ...args) : null;
	}
	
}
