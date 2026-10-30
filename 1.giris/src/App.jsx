import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import Menu from "./Components/Menu/Menu";
import LeaveForm from "./Components/LeaveForm/LeaveForm";
import LeaveTable from "./Components/Tables/LeaveTable";
import ChangeUserInfo from "./Components/UserSettings/ChangeUserInfo";
import { checkUserAuthenticated } from "./Components/services/auth";

const App = () => {
    const [authState, setAuthState] = useState("checking");
    const [retry, setRetry] = useState(0);
    const [currentView, setCurrentView] = useState("menu");
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        checkUserAuthenticated().then((result) => {
            if (!mounted) return;
            if (result === null) {
                // A network failure is not an invalid session. Preserve the token.
                setAuthState("unavailable");
            } else if (!result) {
                localStorage.removeItem("token");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("username");
                navigate("/login", { replace: true });
            } else {
                setAuthState("authorized");
            }
        });
        return () => { mounted = false; };
    }, [navigate, retry]);

    if (authState !== "authorized") return (
        <div className="App" style={{ padding: 24, textAlign: "center" }}>
            <p>{authState === "unavailable" ? "Sunucuya bağlanılamadı. Backend çalışıyor mu?" : "Oturum doğrulanıyor..."}</p>
            {authState === "unavailable" && <button type="button" onClick={() => { setAuthState("checking"); setRetry((value) => value + 1); }}>Tekrar Dene</button>}
        </div>
    );

    const isAdmin = localStorage.getItem("isAdmin") === "true";
    return (
        <div className="App">
            {currentView === "menu" && <Menu isAdmin={isAdmin} handleViewChange={setCurrentView} />}
            {currentView === "userChange" && <ChangeUserInfo handleViewChange={setCurrentView} />}
            {currentView === "leaveForm" && <LeaveForm handleViewChange={setCurrentView} />}
            {currentView === "leaveTable" && <LeaveTable isAdmin={isAdmin} handleViewChange={setCurrentView} />}
        </div>
    );
};
export default App;
