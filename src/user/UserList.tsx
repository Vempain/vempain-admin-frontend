import {useNavigate} from "react-router-dom";
import {UserList as SharedUserList} from "@vempain/vempain-auth-frontend";
import {userAPI} from "../services";

export function UserList() {
    const navigate = useNavigate();
    return (
            <div className={"DarkDiv"} key={"userListDiv"}>
                <SharedUserList userAPI={userAPI} onEdit={id => navigate(`/users/${id}/edit`)} onCreate={() => navigate("/users/0/edit")}/>
            </div>
    );
}
