import { useNavigate } from "react-router-dom";
import "./Menu.css";

const Menu = ({ isAdmin, handleViewChange }) => {
    const navigate = useNavigate();
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("isAdmin");
        navigate("/login", { replace: true });
    };
    return (
        <div className="menu-container">
            <h2>Menü</h2>
            {!isAdmin && <button onClick={() => handleViewChange("userChange")}>Şifre Değiştir</button>}
            {!isAdmin && <button onClick={() => handleViewChange("leaveForm")}>İzin Oluştur</button>}
            {!isAdmin && <button onClick={() => handleViewChange("leaveTable")}>İzinlerim</button>}
            {isAdmin && <button onClick={() => handleViewChange("leaveTable")}>İzin Yönetimi</button>}
            <button className="menu-button logout-button" onClick={logout}>Çıkış Yap</button>
        </div>
    );
};
export default Menu;
