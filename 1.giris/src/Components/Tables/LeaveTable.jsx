import { useCallback, useEffect, useMemo, useState } from "react";
import "./LeaveTable.css";
import PropTypes from "prop-types";
import api from "../../api";

const LeaveTable = ({ isAdmin, handleViewChange }) => {
    const [leaves, setLeaves] = useState([]);
    const [selected, setSelected] = useState([]);
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const reload = useCallback(async () => {
        try {
            const username = localStorage.getItem("username");
            const url = isAdmin ? "/leave/leaves" : `/leave/${encodeURIComponent(username)}`;
            const response = await api.get(url);
            setLeaves(response.data);
            setError("");
        } catch (e) {
            setError(e.response?.data?.message || "İzinler yüklenemedi.");
        }
    }, [isAdmin]);

    useEffect(() => { reload(); }, [reload]);

    const filtered = useMemo(() => leaves.filter((leave) =>
        (!typeFilter || leave.izinTuru === typeFilter) &&
        (leave.personnel?.username || "").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
    ), [leaves, typeFilter, query]);

    const toggle = (id) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
    };

    const bulk = async (action) => {
        if (!selected.length || busy) return;
        setBusy(true); setError("");
        try {
            await api.post(action === "approve" ? "/admin/approve-leaves" : "/admin/reject-leaves",
                { leaveIds: selected });
            setSelected([]);
            await reload();
        } catch (e) {
            setError(e.response?.data?.message || "İzin durumu değiştirilemedi.");
        } finally { setBusy(false); }
    };

    return (
        <div className="izin-tablosu-container">
            <h2>{isAdmin ? "Tüm İzin Tablosu" : "İzinlerim"}</h2>
            {isAdmin && <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input aria-label="Personele göre filtrele" placeholder="Personel ara" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select aria-label="İzin türü filtresi" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">Tüm izin türleri</option>
                    {[...new Set(leaves.map((leave) => leave.izinTuru))].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>}
            {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
            <div style={{ overflowX: "auto" }}>
                <table>
                    <thead><tr>
                        <th>Ad–Soyad</th><th>Tarih</th><th>İzin Türü</th><th>Başlangıç Tarihi</th><th>Bitiş Tarihi</th><th>İzin Süresi</th><th>İzin Gerekçesi</th><th>Durum</th>
                        {isAdmin && <th>Seç</th>}
                    </tr></thead>
                    <tbody>
                        {filtered.length ? filtered.map((leave) => <tr key={leave.id}>
                            <td>{leave.personnel?.username}</td><td>{leave.tarih}</td><td>{leave.izinTuru}</td>
                            <td>{leave.baslangicTarihi || leave.izinSaatAraligi || "-"}</td><td>{leave.bitisTarihi || "-"}</td>
                            <td>{leave.izinSuresi} {leave.izinTuru === "MAZARET_IZIN" ? "saat" : "gün"}</td>
                            <td>{leave.izinGerekcesi}</td><td>{leave.durum}</td>
                            {isAdmin && <td><input type="checkbox" aria-label={`İzin ${leave.id} seç`} disabled={leave.durum !== "Beklemede"} checked={selected.includes(leave.id)} onChange={() => toggle(leave.id)} /></td>}
                        </tr>) : <tr><td colSpan={isAdmin ? 9 : 8}>Gösterilecek izin bulunamadı.</td></tr>}
                    </tbody>
                </table>
            </div>
            {isAdmin && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button disabled={busy || !selected.length} onClick={() => bulk("approve")}>Seçilileri Onayla</button>
                <button disabled={busy || !selected.length} onClick={() => bulk("reject")}>Seçilileri Reddet</button>
            </div>}
            <button className="back-to-menu-button" onClick={() => handleViewChange("menu")}>Menüye Dön</button>
        </div>
    );
};
LeaveTable.propTypes = { isAdmin: PropTypes.bool.isRequired, handleViewChange: PropTypes.func.isRequired };
export default LeaveTable;
