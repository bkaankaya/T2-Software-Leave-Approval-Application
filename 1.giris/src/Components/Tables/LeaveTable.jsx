import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LeaveTable.css";
import axios from "axios";
import PropTypes from "prop-types";

const LeaveTable = ({ isAdmin, handleViewChange }) => {
    const [izinVerileri, setIzinVerileri] = useState([]);
    const [selectedLeaves, setSelectedLeaves] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        const fetchData = async () => {
            try {
                let response;
                if (isAdmin) {
                    response = await axios.get(`http://localhost:8080/api/leave/leaves`, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                } else {
                    response = await axios.get(`http://localhost:8080/api/leave/${username}`, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                }
                setIzinVerileri(response.data);
            } catch (error) {
                console.error("Veri çekerken hata oluştu:", error);
            }
        };

        fetchData();
    }, [isAdmin]);

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

    const handleCheckboxChange = (id) => {
        setSelectedLeaves((prevSelected) => (prevSelected.includes(id) ? prevSelected.filter((leaveId) => leaveId !== id) : [...prevSelected, id]));
    };

    const handleApproveSelected = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.post(
                `http://localhost:8080/api/admin/approve-leaves`,
                { leaveIds: selectedLeaves },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            alert("Seçilen izinler onaylandı!");
        } catch (error) {
            console.error("İzin onaylanırken bir hata oluştu:", error);
        }
    };

    const handleBackToMenu = () => {
        handleViewChange("menu");
    };

    return (
        <div className="izin-tablosu-container">
            <h2>{isAdmin ? "Tüm İzin Tablosu" : "Kullanıcının İzin Tablosu"}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Ad–Soyad</th>
                        <th>Tarih</th>
                        <th>İzin Türü</th>
                        <th>Başlangıç Tarihi</th>
                        <th>Bitiş Tarihi</th>
                        <th>İzin Süresi</th>
                        <th>İzin Gerekçesi</th>
                        <th>Durum</th>
                        {isAdmin && <th>Seç</th>}
                    </tr>
                </thead>
                <tbody>
                    {izinVerileri.length > 0 ? (
                        izinVerileri.map((izin, index) => (
                            <tr key={izin.id || index}>
                                <td>{izin.personnel.username}</td>
                                <td>{izin.tarih}</td>
                                <td>{izin.izinTuru}</td>
                                <td>{izin.baslangicTarihi}</td>
                                <td>{izin.bitisTarihi}</td>
                                <td>{izin.izinSuresi}</td>
                                <td>{izin.izinGerekcesi}</td>
                                <td>{izin.durum}</td>
                                {isAdmin && (
                                    <td>
                                        <input type="checkbox" onChange={() => handleCheckboxChange(izin.id)} checked={selectedLeaves.includes(izin.id)} />
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={isAdmin ? 9 : 8}>Kullanıcıya ait hiçbir izin bulunamadı.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {isAdmin && <button onClick={handleApproveSelected}>Seçili İzinleri Onayla</button>}
            <button className="back-to-menu-button" onClick={handleBackToMenu}>
                Menüye Dön
            </button>
        </div>
    );
};

LeaveTable.propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    handleViewChange: PropTypes.func.isRequired,
};

export default LeaveTable;
