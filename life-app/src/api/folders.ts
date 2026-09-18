import { api } from "./client";

export function getAllFolders() {
    return api.get("/folders");
}

export function getFolderById(id: number) {
    return api.get(`/folders/${id}`);
}

export function createFolder(data: unknown) {
    return api.post("/folders", data);
}

export function updateFolder(id: number, data: unknown) {
    return api.put(`/folders/${id}`, data);
}

export function deleteFolder(id: number) {
    return api.delete(`/folders/${id}`);
}