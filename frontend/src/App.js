import {BrowserRouter, Route, Routes} from "react-router-dom"
import {useContext} from "react"
import './styles/style.scss'
import Home from "./pages/Home"
import Navbar from "./components/Navbar"
import {Context} from "./index"; 
import Notifications from "./pages/Notifications"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"
function App() {
    const {store} = useContext(Context);


    return (
        <BrowserRouter>
            <Navbar />
            <div className="row">
                <div className="col-1"></div>
                <div className="main-content col-9">
                    <Routes>
                        <Route path="/" element={<Home />}/>
                        <Route path="/notifications" element={<Notifications />}/>
                        <Route path="/profile/:id" element={<Profile />}/>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </div>
            </div>
        
        </BrowserRouter>
    )
}

export default App;