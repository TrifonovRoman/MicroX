import { observer } from "mobx-react-lite"
import Header from "../components/Header"

const Register = () => {
    return (
        <>
            <Header title="Регистрация" />
            <div className="auth p-4 mt-5 shadow">
                <div className="auth-form text-center">
                    <form>
                        <div className="form-group my-4">
                            <input type="username" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Имя пользователя" />
                        </div>
                        <div className="form-group my-4">
                            <input type="username" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Электронная почта" />
                        </div>
                        <div className="form-group my-4">
                            <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Пароль" />
                        </div>
                        <div className="form-group my-4">
                            <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Повторите пароль" />
                        </div>
                        
                        <button type="submit" className="btn btn-primary mt-3 w-100">Зарегистрироватся</button>
                    </form>

                </div>
            </div>

        </>
    )
}

export default observer(Register)