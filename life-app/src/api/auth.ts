import { api } from "./client";

export function registerUser(data: { username: string; email: string; password: string }) {
    return api.post("/auth/register", data);
}

export function loginUser(data: { username: string; password: string; token: string}) {
    return api.post("/auth/login", data);
}

export function requestPasswordReset(resetEmail: string) {
    return api.post("/auth/password-reset", { resetEmail })
}

export function sendPassword (data: {password: string; token: string}) {
    return api.post("/auth/verify-password-reset", data)
}