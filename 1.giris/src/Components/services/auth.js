import api from "../../api";

/**
 * valid: verified by the server
 * invalid: missing/revoked/expired credentials (remove local session)
 * unavailable: network, server or unexpected response failure (preserve session)
 */
export const checkUserAuthenticated = async () => {
    if (!localStorage.getItem("token")) return "invalid";
    try {
        const response = await api.get("/auth/verify-token");
        if (response.status !== 200 || response.data?.valid !== true) return "unavailable";
        // Client-side role flags only control the UI. Backend performs authorization.
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("isAdmin", String(response.data.adminControl === true));
        return "valid";
    } catch (error) {
        return [401, 403].includes(error.response?.status) ? "invalid" : "unavailable";
    }
};
