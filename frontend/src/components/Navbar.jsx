import React from "react"
import {observer} from "mobx-react-lite"
import { Link, useLocation } from 'react-router-dom';
import Divider from "./Divider";
import Avatar from "./Avatar";


const Navbar = () => {
    const location = useLocation()

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="sidebar">
        <Link to="/" className="text-decoration-none text-dark">
            <div className="logo-section">
                <div className="logo">Y</div>
            </div>
        </Link>

        <div className="divider"></div>

        <div class="nav-menu">
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <i className="bi bi-house"></i>
            </Link>
            <Link to="/profile/0" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                <i className="bi bi-person"></i>
            </Link>
            <Link to="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
                <i className="bi bi-bell"></i>
            </Link>
        </div>

        <Avatar username="admin"/>
    </nav>
    )
}

export default observer(Navbar)