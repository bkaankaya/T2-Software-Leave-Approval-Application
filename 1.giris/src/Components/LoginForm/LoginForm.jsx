import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import "./LoginForm.css";
import api from "../../api";

const LoginRegister = () => {
    const [registering, setRegistering] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const registerUser = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setBusy(true); setError("");
        try {
            await api.post("/login/register", {
                username: form.elements.username.value.trim(),
                email: form.elements.email.value.trim(),
                password: form.elements.password.value,
            });
            setRegistering(false);
            form.reset();
            alert("Kayıt başarılı. Şimdi giriş yapabilirsiniz.");
        } catch (e) {
            setError(e.response?.data?.message || "Kayıt işlemi başarısız.");
        } finally { setBusy(false); }
    };

    const loginUser = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setBusy(true); setError("");
        try {
            const response = await api.post("/login", {
                username: form.elements.username.value.trim(),
                password: form.elements.password.value,
            });
            const { token, username, adminControl } = response.data;
            if (!token) throw new Error("No token");
            localStorage.setItem("token", token);
            localStorage.setItem("username", username);
            localStorage.setItem("isAdmin", String(adminControl));
            navigate("/", { replace: true });
        } catch (e) {
            setError(e.response?.data?.message || "Giriş başarısız. Kullanıcı bilgilerinizi kontrol edin.");
        } finally { setBusy(false); }
    };

    return (
        <div className={`wrapper ${registering ? "active" : ""}`}>
            <div className="form-box login">
                <form onSubmit={loginUser}>
                    <h1>Login</h1>
                    <div className="input-box"><input type="text" name="username" placeholder="Username" required autoComplete="username" /><FaUser className="icon" /></div>
                    <div className="input-box"><input type="password" name="password" placeholder="Password" required autoComplete="current-password" /><FaLock className="icon" /></div>
                    <button type="submit" disabled={busy}>Login</button>
                    <div className="register-link"><p>Don&apos;t have an account? <a href="#register" onClick={(e) => {e.preventDefault(); setRegistering(true); setError("");}}>Register</a></p></div>
                </form>
            </div>
            <div className="form-box register">
                <form onSubmit={registerUser}>
                    <h1>Registration</h1>
                    <div className="input-box"><input type="text" name="username" placeholder="Username" required maxLength="80" autoComplete="username" /><FaUser className="icon" /></div>
                    <div className="input-box"><input type="email" name="email" placeholder="Email" required maxLength="254" autoComplete="email" /><FaEnvelope className="icon" /></div>
                    <div className="input-box"><input type="password" name="password" placeholder="Password (8+ characters)" required minLength="8" autoComplete="new-password" /><FaLock className="icon" /></div>
                    <button type="submit" disabled={busy}>Register</button>
                    <div className="register-link"><p>Already have an account? <a href="#login" onClick={(e) => {e.preventDefault(); setRegistering(false); setError("");}}>Login</a></p></div>
                </form>
            </div>
            {error && <p role="alert" style={{ color: "#d32f2f", position: "absolute", bottom: 8, padding: 8 }}>{error}</p>}
        </div>
    );
};
export default LoginRegister;
