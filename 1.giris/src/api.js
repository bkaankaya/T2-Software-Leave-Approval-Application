const baseURL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

async function request(method, path, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const token = localStorage.getItem("token");
        const headers = { Accept: "application/json" };
        if (payload !== undefined) headers["Content-Type"] = "application/json";
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${baseURL}${path}`, {
            method,
            headers,
            body: payload === undefined ? undefined : JSON.stringify(payload),
            signal: controller.signal,
        });
        const raw = await response.text();
        let data = null;
        if (raw) {
            try { data = JSON.parse(raw); }
            catch { data = { message: raw.slice(0, 200) }; }
        }
        if (!response.ok) {
            const error = new Error(data?.message || `HTTP ${response.status}`);
            error.response = { status: response.status, data };
            throw error;
        }
        return { status: response.status, data };
    } catch (error) {
        if (error.name === "AbortError") throw new Error("Sunucudan yanıt alınamadı (zaman aşımı)");
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export default {
    get: (path) => request("GET", path),
    post: (path, payload) => request("POST", path, payload),
    put: (path, payload) => request("PUT", path, payload),
};
