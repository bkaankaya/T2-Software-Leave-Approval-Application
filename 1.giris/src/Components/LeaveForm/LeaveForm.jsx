import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LeaveForm.css";

const LeaveForm = ({ handleViewChange }) => {
    const [formData, setFormData] = useState({
        personel: { username: localStorage.getItem("username") },
        adSoyad: "",
        tarih: "",
        izinTuru: undefined,
        baslangicTarihi: "",
        bitisTarihi: "",
        baslangicSaati: "",
        bitisSaati: "",
        izinSuresi: "",
        izinGerekcesi: "",
        izinSaatAraligi: "",
    });
    const [error, setError] = useState("");
    const [validationError, setValidationError] = useState("");
    const navigate = useNavigate();

    const saatAraliklari = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"];

    useEffect(() => {
        if (formData.izinTuru === "MAZARET_IZIN" && formData.izinSaatAraligi) {
            const [baslangicSaati, bitisSaati] = formData.izinSaatAraligi.split(" - ");
            const baslangic = new Date(`1970-01-01T${baslangicSaati}:00`);
            const bitis = new Date(`1970-01-01T${bitisSaati}:00`);
            const fark = (bitis - baslangic) / (1000 * 60 * 60);
            setFormData((prevData) => ({
                ...prevData,
                izinSuresi: fark.toFixed(2).toString(),
            }));
        } else if (formData.baslangicTarihi && formData.bitisTarihi) {
            const baslangic = new Date(formData.baslangicTarihi);
            const bitis = new Date(formData.bitisTarihi);
            const timeDiff = bitis - baslangic;

            const izinSuresi = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

            if (izinSuresi > 0) {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    izinSuresi: izinSuresi.toString(),
                }));
            } else {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    izinSuresi: "",
                }));
            }
        }
    }, [formData.izinSaatAraligi, formData.baslangicTarihi, formData.bitisTarihi, formData.izinTuru]);

    useEffect(() => {
        const savedAdSoyad = localStorage.getItem("username") || "Ad Soyad Bilinmiyor";
        setFormData((prevFormData) => ({
            ...prevFormData,
            adSoyad: savedAdSoyad,
        }));
    }, []);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCheckboxChange = (e) => {
        const { name } = e.target;
        setFormData((prevState) => {
            if (prevState.izinTuru === name) {
                return {
                    ...prevState,
                    izinTuru: undefined,
                };
            } else {
                return {
                    ...prevState,
                    izinTuru: name,
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.tarih || (!formData.baslangicTarihi && !formData.izinSaatAraligi) || !formData.izinGerekcesi || !formData.izinTuru) {
            setValidationError("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Token bulunamadı, lütfen giriş yapın.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:8080/api/admin", formData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                console.log("Leave data submitted successfully.");
                alert("İzin formu başarıyla gönderildi.");
                handleViewChange("menu");
            } else {
                console.error("Failed to submit leave data.");
            }
        } catch (error) {
            console.error("Form gönderiminde hata oluştu:", error);
            setError("Form gönderiminde bir hata oluştu.");
        }
    };

    const handleBackToMenu = () => {
        handleViewChange("menu");
    };

    return (
        <div className="izin-formu-container">
            <div className="form-header">
                <div className="logo">T2</div>
                <h1>Personel İzin Formu</h1>
            </div>
            <form className="izin-formu" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Ad–Soyad :</label>
                    <input type="text" name="adSoyad" value={formData.adSoyad} readOnly style={{ cursor: "not-allowed" }} />
                </div>
                <div className="form-group">
                    <label>Tarih :</label>
                    <input type="date" name="tarih" value={formData.tarih} onChange={handleChange} />
                </div>
                <div className="form-group checkbox-group">
                    <label>
                        <input type="checkbox" name="YILLIK_IZIN" checked={formData.izinTuru === "YILLIK_IZIN"} onChange={handleCheckboxChange} />
                        Yıllık İzin
                    </label>
                    <label>
                        <input type="checkbox" name="MAZARET_IZIN" checked={formData.izinTuru === "MAZARET_IZIN"} onChange={handleCheckboxChange} />
                        Mazeret İzni
                    </label>
                    <label>
                        <input type="checkbox" name="MAHSUP_IZIN" checked={formData.izinTuru === "MAHSUP_IZIN"} onChange={handleCheckboxChange} />
                        Mahsup İzin
                    </label>
                    <label>
                        <input type="checkbox" name="UCRETSIZ_IZIN" checked={formData.izinTuru === "UCRETSIZ_IZIN"} onChange={handleCheckboxChange} />
                        Ücretsiz İzin
                    </label>
                    <label>
                        <input type="checkbox" name="HASTALIK_IZNI" checked={formData.izinTuru === "HASTALIK_IZNI"} onChange={handleCheckboxChange} />
                        Hastalık İzni
                    </label>
                    <label>
                        <input type="checkbox" name="DOGUM_IZNI" checked={formData.izinTuru === "DOGUM_IZNI"} onChange={handleCheckboxChange} />
                        Doğum İzni
                    </label>
                    <label>
                        <input type="checkbox" name="OLUM_IZIN" checked={formData.izinTuru === "OLUM_IZIN"} onChange={handleCheckboxChange} />
                        Ölüm İzni
                    </label>
                    <label>
                        <input type="checkbox" name="EVLILIK_IZNI" checked={formData.izinTuru === "EVLILIK_IZNI"} onChange={handleCheckboxChange} />
                        Evlilik İzni
                    </label>
                </div>

                {formData.izinTuru === "MAZARET_IZIN" && (
                    <div className="form-group">
                        <label>İzin Saat Aralığı:</label>
                        <select name="izinSaatAraligi" value={formData.izinSaatAraligi} onChange={handleChange} style={{ width: "100%" }}>
                            <option value="">Saat aralığı seçin</option>
                            {saatAraliklari.map((aralik, index) => (
                                <option key={index} value={aralik}>
                                    {aralik}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {formData.izinTuru !== "MAZARET_IZIN" && (
                    <>
                        <div className="form-group">
                            <label>İzin Başlangıç Tarihi :</label>
                            <input type="date" name="baslangicTarihi" value={formData.baslangicTarihi} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>İzin Bitiş Tarihi :</label>
                            <input type="date" name="bitisTarihi" value={formData.bitisTarihi} onChange={handleChange} />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label>İzin Süresi :</label>
                    <div style={{ display: "flex", width: "100%" }}>
                        <input type="text" name="izinSuresi" value={formData.izinSuresi} readOnly style={{ width: "80px", marginRight: "5px", cursor: "not-allowed" }} />
                        <span>{formData.izinTuru === "MAZARET_IZIN" ? "saat" : "gün"}</span>
                    </div>
                </div>
                <div className="form-group">
                    <label>İzin Gerekçesi :</label>
                    <textarea name="izinGerekcesi" value={formData.izinGerekcesi} onChange={handleChange} maxLength="200"></textarea>
                </div>
                {validationError && <p style={{ color: "red" }}>{validationError}</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit">Gönder</button>
            </form>
            <button onClick={handleBackToMenu}>Menüye Dön</button>
        </div>
    );
};

export default LeaveForm;
