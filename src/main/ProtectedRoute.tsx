import {Navigate, Outlet, useLocation} from "react-router-dom";
import {useSession} from "@vempain/vempain-auth-frontend";

/**
 * Keep unauthenticated users out of admin screens. API authorization remains
 * the authoritative control; this prevents direct navigation from rendering
 * an admin screen before the API can reject its requests.
 */
export function ProtectedRoute() {
    const {userSession} = useSession();
    const location = useLocation();

    if (!userSession) {
        return <Navigate to="/login" replace state={{from: `${location.pathname}${location.search}`}}/>;
    }

    return <Outlet/>;
}
