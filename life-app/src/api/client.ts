const API_URL = import.meta.env.VITE_API_URL;

function getToken() {
    return localStorage.getItem("token");
}

async function request(endpoint: string, options: RequestInit = {}) {
    const token = getToken();

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return null;

    return res.json();
}

export const api = {
    get: (endpoint: string) => request(endpoint, { method: "GET" }),
    post: (endpoint: string, body: unknown) =>
        request(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint: string, body: unknown) =>
        request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
};