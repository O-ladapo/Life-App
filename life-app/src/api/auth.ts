import { api } from "./client";

export function registerUser(data: { username: string; email: string; password: string }) {
    return api.post("/auth/register", data);
}

export function loginUser(data: { username: string; password: string }) {
    return api.post("/auth/login", data);
}