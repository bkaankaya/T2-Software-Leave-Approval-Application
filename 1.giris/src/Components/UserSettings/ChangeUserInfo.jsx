import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./ChangeUserInfo.css";
import api from "../../api";

const ChangeUserInfo = ({ handleViewChange }) => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ username: "", oldPassword: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        setUserInfo((prev) => ({ ...prev, username: localStorage.getItem("username") || "" }));
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userInfo.password === userInfo.oldPassword) {
            setError("Yeni şifre mevcut şifreden farklı olmalıdır."); return;
        }
        setBusy(true); setError("");
        try {
            await api.put(`/users/${encodeURIComponent(userInfo.username)}/update-password`, {
                oldPassword: userInfo.oldPassword, newPassword: userInfo.password,
            });
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("isAdmin");
            alert("Şifreniz değiştirildi. Lütfen yeniden giriş yapın.");
            navigate("/login", { replace: true });
        } catch (e) {
            setError(e.response?.data?.message || "Şifre değiştirilemedi.");
        } finally { setBusy(false); }
    };
    return (
        <div className="change-user-info-container">
            <h2>Şifre Değiştir</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Kullanıcı Adı:</label>
                    <input type="text" name="username" value={userInfo.username} readOnly /></div>
                <div className="form-group"><label>Mevcut Şifre:</label>
                    <input type="password" name="oldPassword" value={userInfo.oldPassword} required autoComplete="current-password" onChange={(e) => setUserInfo({ ...userInfo, oldPassword: e.target.value })} /></div>
                <div className="form-group"><label>Yeni Şifre:</label>
                    <input type="password" name="password" value={userInfo.password} required minLength="8" autoComplete="new-password" onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })} /></div>
                {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
                <button type="submit" disabled={busy}>Güncelle</button>
                <button type="button" onClick={() => handleViewChange("menu")}>Menüye Dön</button>
            </form>
        </div>
    );
};
ChangeUserInfo.propTypes = { handleViewChange: PropTypes.func.isRequired };
export default ChangeUserInfo;
