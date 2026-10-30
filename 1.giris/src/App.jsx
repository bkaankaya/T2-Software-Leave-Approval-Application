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
    const [authorized, setAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        checkUserAuthenticated().then((valid) => {
            if (!mounted) return;
            if (!valid) {
                localStorage.removeItem("token");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("username");
                navigate("/login", { replace: true });
            } else setAuthorized(true);
        });
        return () => { mounted = false; };
    }, [navigate]);

    if (!authorized) return <div className="App"><p>Oturum doğrulanıyor...</p></div>;
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
