import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const Menu = ({ isAdmin, handleViewChange }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem("token");
            const username = localStorage.getItem("username");
            if (!token || !username) {
                navigate("/login");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [navigate]);
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("isAdmin");

        navigate("/login");
    };
    return (
        <div className="menu-container">
            <h2>Menü</h2>
            {!isAdmin && <button onClick={() => handleViewChange("userChange")}>Kullanıcı Bilgilerini Değiştir</button>}
            {!isAdmin && <button onClick={() => handleViewChange("leaveForm")}>İzin Oluştur</button>}
            {!isAdmin && <button onClick={() => handleViewChange("leaveTable")}>İzinlerim</button>}
            {isAdmin && <button onClick={() => handleViewChange("leaveTable")}>İzinler</button>}
            <button className="menu-button logout-button" onClick={handleLogout}>
                Çıkış Yap
            </button>
        </div>
    );
};

export default Menu;
