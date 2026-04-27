import { useEffect, useState } from "react";
import "./App.css";
import Menu from "./Components/Menu/Menu";
import LeaveForm from "./Components/LeaveForm/LeaveForm";
import LeaveTable from "./Components/Tables/LeaveTable";
import LoginForm from "./Components/LoginForm/LoginForm";
import React from "react";
import ChangeUserInfo from "./Components/UserSettings/ChangeUserInfo";
import { useNavigate } from "react-router-dom";

const App = () => {
    const [currentView, setCurrentView] = useState("menu");
    const nagivate = useNavigate();

    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    const token = localStorage.getItem("token");
    useEffect(() => {
        if (!token) nagivate("/login");
    }, [token]);

    const isAdmin = localStorage.getItem("isAdmin");
    return (
        <div className="App">
            {currentView === "menu" ? (
                <Menu isAdmin={isAdmin === "true"} handleViewChange={handleViewChange} />
            ) : currentView === "userChange" ? (
                <ChangeUserInfo handleViewChange={handleViewChange} />
            ) : currentView === "leaveForm" ? (
                <LeaveForm handleViewChange={handleViewChange} />
            ) : currentView === "leaveTable" ? (
                <LeaveTable isAdmin={isAdmin === "true"} handleViewChange={handleViewChange} />
            ) : null}
        </div>
    );
};

export default App;
