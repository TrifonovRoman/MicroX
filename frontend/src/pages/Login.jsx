import { observer } from "mobx-react-lite"
import Header from "../components/Header"

const Login = () => {
    return (
        <>
            <Header title="Авторизация" />
            <div className="auth p-4 mt-5 shadow">
                <div className="auth-form text-center">
                    <form>
                        <div className="form-group my-4">
                            <input type="username" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Имя пользователя" />
                        </div>
                        <div className="form-group my-4">
                            <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Пароль" />
                        </div>
                        
                        <button type="submit" className="btn btn-primary mt-3 w-100">Войти</button>
                    </form>

                </div>
            </div>

        </>
    )
}

export default observer(Login)