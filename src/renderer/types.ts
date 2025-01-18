export type ItemId = string;

export type Item = {
	_id: ItemId;
	createdAt?: number;
	modifiedAt?: number;
	[key: string]: unknown;
};

export type Items = Item[] | Record<string, Item[]>;

export type DrainedItems = Items;

export type ItemsArrayMakeId = (item: Item) => ItemId;
export type ItemsObjectMapMakeId = Record<string, (item: Item) => ItemId>;
export type MakeId = ItemsArrayMakeId | ItemsObjectMapMakeId;
