import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginForm from "./Components/LoginForm/LoginForm";

export const routers = createBrowserRouter([
    { path: "/", element: <App />, errorElement: <p>Sayfa bulunamadı.</p> },
    { path: "/login", element: <LoginForm />, errorElement: <p>Sayfa bulunamadı.</p> },
]);
