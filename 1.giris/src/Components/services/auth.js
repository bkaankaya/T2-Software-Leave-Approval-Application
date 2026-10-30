import api from "../../api";

export const checkUserAuthenticated = async () => {
    if (!localStorage.getItem("token")) return false;
    try {
        const response = await api.get("/auth/verify-token");
        if (response.status !== 200 || response.data?.valid !== true) return false;
        // The server is authoritative; client storage is not an authorization source.
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("isAdmin", String(response.data.adminControl === true));
        return true;
    } catch {
        return false;
    }
};
