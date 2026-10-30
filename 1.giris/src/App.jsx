import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import Menu from "./Components/Menu/Menu";
import LeaveForm from "./Components/LeaveForm/LeaveForm";
import LeaveTable from "./Components/Tables/LeaveTable";
import ChangeUserInfo from "./Components/UserSettings/ChangeUserInfo";
import { checkUserAuthenticated } from "./Components/services/auth";

const App = () => {
    const [currentView, setCurrentView] = useState("menu");
    const [sessionStatus, setSessionStatus] = useState("loading");
    const [attempt, setAttempt] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        checkUserAuthenticated().then((result) => {
            if (!mounted) return;
            if (result === "invalid") {
                localStorage.removeItem("token");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("username");
                navigate("/login", { replace: true });
            } else {
                setSessionStatus(result);
            }
        }).catch(() => {
            if (mounted) setSessionStatus("unavailable");
        });
        return () => { mounted = false; };
    }, [navigate, attempt]);

    if (sessionStatus === "unavailable") {
        return <main className="App session-message" role="alert">
            <h2>Sunucuya bağlanılamadı</h2>
            <p>Oturumun korundu. Backend çalışıyorsa tekrar deneyebilirsin.</p>
            <button type="button" onClick={() => { setSessionStatus("loading"); setAttempt((v) => v + 1); }}>
                Tekrar Dene
            </button>
        </main>;
    }
    if (sessionStatus !== "valid") {
        return <main className="App session-message"><p>Oturum doğrulanıyor...</p></main>;
    }
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    return (
        <main className="App">
            {currentView === "menu" && <Menu isAdmin={isAdmin} handleViewChange={setCurrentView} />}
            {currentView === "userChange" && <ChangeUserInfo handleViewChange={setCurrentView} />}
            {currentView === "leaveForm" && <LeaveForm handleViewChange={setCurrentView} />}
            {currentView === "leaveTable" && <LeaveTable isAdmin={isAdmin} handleViewChange={setCurrentView} />}
        </main>
    );
};
export default App;
