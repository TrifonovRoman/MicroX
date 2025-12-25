import { observer } from "mobx-react-lite"
import Header from "../components/Header"
import {useContext, useState} from "react";
import {Link, Navigate, useNavigate} from "react-router-dom";
import MyButton from "../components/MyButton"
import {Context} from "../index";

const Login = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate();
    const {store} = useContext(Context)
    if (store.isAuth) {
        return <Navigate to={'/'} replace />
    }

    const loginHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        if (!valid()) {
            setIsLoading(false)
            return
        }
        try {
            await store.loginUser(username, password)
            setIsLoading(false)
            navigate('/', {replace: true})
        } catch (er) {
            setError(er?.response?.data?.error || er?.message || "Неправильное имя пользователя или пароль!")
            setIsLoading(false)
        }


    }

    const valid = () => {
        if (!username.trim()) {
            setError("Имя пользователя не может быть пустым");
            return false;
        }
        if (username.length < 4) {
            setError("Имя пользователя должно содержать не менее 4 символов");
            return false;
        }
        if (!password) {
            setError("Пароль не может быть пустым");
            return false;
        }
        if (password.length < 5) {
            setError("Пароль должен содержать не менее 5 символов");
            return false;
        }
        return true;
    }



    return (
        <>
            <Header title="Авторизация" />
            <div className="auth p-4 main-content-line text-center">
                <span className="text-muted">Еще не зарегистрированы? </span>
                <Link to="/register">Создать аккаунт</Link>
                <div className="auth-form text-center">
                    <form onSubmit={loginHandler}>
                        <div className="form-group my-4">
                            <input
                                type="username"
                                className="form-control"
                                placeholder="Имя пользователя"
                                onChange={(event) => {
                                    setUsername(event.target.value)
                                }}

                            />
                        </div>
                        <div className="form-group my-4">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Пароль"
                                onChange={(event) => {
                                    setPassword(event.target.value)
                                }}
                            />
                        </div>
                        <span className="text-danger">{error}</span>
                        <MyButton type="submit" onClick={loginHandler} btnType={"primary mt-3 w-100"} isLoading={isLoading ? 1 : 0} disabled={isLoading}>{isLoading ? "Вход..." : "Войти"}</MyButton>
                    </form>

                </div>
            </div>

        </>
    )
}

export default observer(Login)