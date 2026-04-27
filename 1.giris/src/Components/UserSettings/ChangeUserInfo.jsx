import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangeUserInfo.css";

const ChangeUserInfo = ({ handleViewChange }) => {
    const [userInfo, setUserInfo] = useState({
        username: "",
        oldPassword: "",
        password: "",
    });
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false); // Menü sayfasını gösterip göstermemeyi kontrol eden state

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserInfo({ ...userInfo, [name]: value });
    };
    useEffect(() => {
        const savedAdSoyad = localStorage.getItem("username") || "Ad Soyad Bilinmiyor";
        setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            username: savedAdSoyad,
        }));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem("token");
            const username = localStorage.getItem("username");

            if (!token || !username) {
                navigate("/login");
            }
        }, 1000); // 1000 milisaniyede(1saniyede) bir kontrol işlemini gerçekleştirir

        return () => clearInterval(interval);
    }, [navigate]);
    const handleSubmit = (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token bulunamadı, lütfen giriş yapın.");
            return;
        }
        if (userInfo.password === userInfo.oldPassword) {
            alert("Eski şifren yeni şifren ile aynı olamaz!");
            return;
        }
        fetch(`http://localhost:8080/api/users/${userInfo.username}/update-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // JWT Token'ı ekliyoruz
            },

            body: JSON.stringify({ newPassword: userInfo.password }), // Yalnızca yeni şifreyi gönderiyoruz
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Şifre güncellenirken hata oluştu");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Success:", data);
                alert("Şifre başarıyla güncellendi.");
                handleViewChange("menu");
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("Şifre güncellenirken bir hata oluştu.");
            });
    };

    const handleBackToMenu = () => {
        handleViewChange("menu");
    };

    return (
        <div className="change-user-info-container">
            <h2>Kullanıcı Bilgilerini Değiştir</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Kullanıcı Adı:</label>
                    <input type="text" name="username" value={userInfo.username} readOnly style={{ cursor: "not-allowed" }} />
                </div>
                <div className="form-group">
                    <label>Yeni Şifre:</label>
                    <input type="password" name="password" value={userInfo.password} onChange={handleChange} />
                </div>
                <button type="submit">Güncelle</button>
                <button type="button" onClick={handleBackToMenu}>
                    Menüye Dön
                </button>
            </form>
        </div>
    );
};

export default ChangeUserInfo;
