import {BrowserRouter, Route, Routes} from "react-router-dom"
import {useContext, useEffect} from "react"
import './styles/style.scss'
import Home from "./pages/Home"
import Navbar from "./components/Navbar"
import {Context} from "./index"; 
import Notifications from "./pages/Notifications"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"
import CreatePost from "./pages/CreatePost";
import PostPage from "./pages/PostPage";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import EditProfile from "./pages/EditProfile.tsx";
function App() {
    const {store} = useContext(Context)
    useEffect(() => {
        try {
            store.checkAuth()
                .catch(e => {
                    console.log(e.response.data.error);
                });
        } catch (e) {
            console.log(e.response.data)
        }

    }, [store])


    return (
        <BrowserRouter>
            <Navbar />
            <div className="row">
                <div className="col-12 col-sm-1"></div>
                <div className="col-12 main-content col-sm-9">
                    <Routes>
                        <Route path="/" element={<Home />}/>


                        <Route path="/posts/:id" element={<PostPage />}/>
                        <Route path="/login" element={<Login />} />
                        <Route element={<ProtectedRoute redirectPath="/login"/>}>
                            <Route path="/profile/:id" element={<Profile />}/>
                            <Route path="/profile/edit" element={<EditProfile />}/>
                            <Route path="/create" element={<CreatePost />} />
                            <Route path="/notifications" element={<Notifications />}/>
                        </Route>

                        <Route path="/register" element={<Register />} />
                    </Routes>
                </div>
            </div>
        
        </BrowserRouter>
    )
}

export default App;