import { api } from "./client";

export function getAllItems() {
    return api.get("/items");
}

export function getItemById(id: number) {
    return api.get(`/items/${id}`);
}

export function createItem(data: unknown) {
    return api.post("/items", data);
}

export function updateItem(id: number, data: unknown) {
    return api.put(`/items/${id}`, data);
}

export function deleteItem(id: number) {
    return api.delete(`/items/${id}`);
}