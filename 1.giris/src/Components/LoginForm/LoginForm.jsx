import { useState } from "react";
import "./LoginForm.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const LoginRegister = () => {
    const [action, setAction] = useState("");
    const navigate = useNavigate();

    const registerLink = () => {
        setAction("active");
    };

    const loginLink = () => {
        setAction("");
    };

    // Kayıt fonksiyonu (registerUser)
    const registerUser = async (event) => {
        event.preventDefault();

        const username = event.target.username.value;
        const email = event.target.email.value;
        const password = event.target.password.value;

        const data = {
            username: username,
            email: email,
            password: password,
        };

        try {
            const response = await fetch("http://localhost:8080/api/login/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                window.location.href = "/login";
            } else {
                const result = await response.json();
                alert("Kullanıcı kaydı başarısız: " + result.message);
            }
        } catch (error) {
            console.error("Hata:", error);
            alert("Kayıt sırasında bir hata oluştu.");
        }
    };

    // Giriş fonksiyonu (loginUser)
    const loginUser = async (event) => {
        event.preventDefault();

        const username = event.target.username.value;
        const password = event.target.password.value;

        const data = {
            username: username,
            password: password,
        };

        try {
            const response = await fetch("http://localhost:8080/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const responseToken = await response.json();

            if (responseToken.token) {
                localStorage.setItem("token", responseToken.token);
                localStorage.setItem("username", username);
                localStorage.setItem("isAdmin", responseToken.adminControl);

                setAction("menu");
                navigate("/");
            } else {
                alert("Giriş başarısız: " + responseToken.message);
            }
        } catch (error) {
            console.error("Giriş sırasında bir hata oluştu:", error);
        }
    };

    return (
        <div className={`wrapper ${action}`}>
            <div className="form-box login">
                <form onSubmit={loginUser}>
                    <h1>Login</h1>
                    <div className="input-box">
                        <input type="text" name="username" placeholder="Username" required />
                        <FaUser className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="password" name="password" placeholder="Password" required />
                        <FaLock className="icon" />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <a href="#">Forgot password?</a>
                    </div>
                    <button type="submit">Login</button>
                    <div className="register-link">
                        <p>
                            Don't have an account?{" "}
                            <a href="#" onClick={registerLink}>
                                Register
                            </a>
                        </p>
                    </div>
                </form>
            </div>

            <div className="form-box register">
                <form onSubmit={registerUser}>
                    <h1>Registration</h1>
                    <div className="input-box">
                        <input type="text" name="username" placeholder="Username" required />
                        <FaUser className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="email" name="email" placeholder="Email" required />
                        <FaEnvelope className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="password" name="password" placeholder="Password" required />
                        <FaLock className="icon" />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" />I agree to the terms & conditions
                        </label>
                    </div>
                    <button type="submit">Register</button>
                    <div className="register-link">
                        <p>
                            Already have an account?{" "}
                            <a href="#" onClick={loginLink}>
                                Login
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginRegister;
