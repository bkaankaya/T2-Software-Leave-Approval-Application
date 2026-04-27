import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginForm from "./Components/LoginForm/LoginForm";
import LeaveTable from "./Components/Tables/LeaveTable";
import ChangeUserInfo from "./Components/UserSettings/ChangeUserInfo";
import LeaveForm from "./Components/LeaveForm/LeaveForm";

export const routers = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <>404</>,
    },
    { path: "/login", element: <LoginForm />, errorElement: <>404</> },
]);
