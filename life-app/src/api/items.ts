import { api } from "./client";
import type { Item } from '../components/Planner/components/ItemType';

export function getAllItems() {
    return api.get("/items");
}

export function getItemById(id: number) {
    return api.get(`/items/${id}`);
}

export function getItemsByDate(date: string) {
    return api.get(`/items/by-date?date=${date}`) as Promise<Item[]>;
}

export function getUpcomingItemsByDateAndType(date: string, itemType: string): Promise<Item[]> {
    return api.get(`/items/by-upcoming-date?date=${date}&type=${itemType}`);
}

export function createItem(data: unknown): Promise<Item>  {
    return api.post("/items", data);
}

export function updateItem(id: number, data: unknown) {
    return api.put(`/items/${id}`, data);
}

export function deleteItem(id: number) {
    return api.delete(`/items/${id}`);
}