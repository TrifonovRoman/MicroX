import {useContext} from "react";
import {Context} from "../index";
import {Navigate, Outlet} from "react-router-dom";

interface ProtectedRouteProps {
    redirectPath: string
}

const ProtectedRoute = ({redirectPath = "/login"}: ProtectedRouteProps) => {
    const {store} = useContext(Context)

    if (store.id === -1) {
        return <Navigate to={redirectPath} replace />
    }

    return <Outlet />
}

export default ProtectedRoute
