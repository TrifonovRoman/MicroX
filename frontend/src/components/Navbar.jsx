import React, {useContext} from "react"
import {observer} from "mobx-react-lite"
import { Link, useLocation } from 'react-router-dom';
import Divider from "./Divider";
import Avatar from "./Avatar";
import {Context} from "../index";


const Navbar = () => {
    const location = useLocation()
    const {store} = useContext(Context)

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        try {
            await store.logoutUser()

        } catch (e) {
            console.log("error via logout")
        }
    }

    return (
        <nav className="sidebar">
        <Link to="/" className="text-decoration-none text-dark">
            <div className="logo-section">
                <div className="logo">Y</div>
            </div>
        </Link>

        <div className="divider"></div>

        <div className="nav-menu">
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <i className="bi bi-house"></i>
            </Link>
            <Link to={`/profile/${store.id}`} className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                <i className="bi bi-person"></i>
            </Link>
            <Link to="/create" className={`nav-item ${isActive('/create') ? 'active' : ''}`}>
                <i className="bi bi-plus-lg"></i>
            </Link>
            <Link to="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
                <i className="bi bi-bell"></i>
            </Link>
        </div>
        <Link to={`/profile/${store.id}`} className={store.isAuth ? '' : 'd-none'}>
            <Avatar username={store.username} id={store.id} isLocal={0} url={store.avatar_url}/>
        </Link>
        <Link to="/login" className={`d-flex align-items-center justify-content-center nav-item ${isActive('/login') ? 'active' : ''} ${!store.isAuth ? '' : 'd-none'}`}>
            <i className="bi bi-box-arrow-in-right"></i>
        </Link>
        <div onClick={handleLogout} className={`d-flex align-items-center justify-content-center cursor-pointer nav-item mt-2 ${store.isAuth ? '' : 'd-none'}`}>
            <i className="bi bi-box-arrow-right"></i>
        </div>
    </nav>
    )
}

export default observer(Navbar)