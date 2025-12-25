import { observer } from "mobx-react-lite";
import Header from "../components/Header";
import { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Context } from "../index";
import MyButton from "../components/MyButton";

const Register = () => {
    const { store } = useContext(Context);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (store.isAuth) {
        return <Navigate to="/" replace />;
    }

    const validate = () => {
        setError("");

        if (!username.trim()) {
            setError("Имя пользователя не может быть пустым");
            return false;
        }
        if (username.length < 4) {
            setError("Имя пользователя должно содержать не менее 4 символов");
            return false;
        }
        if (!password) {
            setError("Пароль обязателен");
            return false;
        }
        if (password.length < 6) {
            setError("Пароль должен содержать не менее 6 символов");
            return false;
        }
        if (password !== repeatPassword) {
            setError("Пароли не совпадают");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            await store.registerUser(username.trim(), password);
            navigate("/", { replace: true });
        } catch (err) {
            const message =
                err?.response?.data?.error ||
                err?.message ||
                "Ошибка при регистрации. Попробуйте позже.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearErrorOnInput = () => {
        if (error) setError("");
    };

    return (
        <>
            <Header title="Регистрация" />
            <div className="auth p-4 main-content-line text-center">
                <p className="text-muted mb-3">
                    Уже зарегистрированы?{" "}
                    <Link to="/login" className="text-decoration-none">
                        Войти в аккаунт
                    </Link>
                </p>

                <div className="auth-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group my-4">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Имя пользователя"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    clearErrorOnInput();
                                }}
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group my-4">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    clearErrorOnInput();
                                }}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group my-4">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Повторите пароль"
                                value={repeatPassword}
                                onChange={(e) => {
                                    setRepeatPassword(e.target.value);
                                    clearErrorOnInput();
                                }}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                        </div>

                        {error && <div className="text-danger mb-3">{error}</div>}

                        <MyButton
                            type="submit"
                            btnType="primary mt-3 w-100"
                            disabled={isLoading}
                            isLoading={isLoading ? 1 : 0}
                        >
                            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                        </MyButton>
                    </form>
                </div>
            </div>
        </>
    );
};

export default observer(Register);