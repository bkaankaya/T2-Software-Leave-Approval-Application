import api from "../../api";

export const checkUserAuthenticated = async () => {
    if (!localStorage.getItem("token")) return false;
    try {
        const response = await api.get("/auth/verify-token");
        return response.status === 200 && response.data?.valid === true;
    } catch {
        return false;
    }
};
