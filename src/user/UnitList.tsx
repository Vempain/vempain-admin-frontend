import {useNavigate} from "react-router-dom";
import {UnitList as SharedUnitList} from "@vempain/vempain-auth-frontend";
import {unitAPI} from "../services";

export function UnitList() {
    const navigate = useNavigate();
    return (
            <div className={"DarkDiv"} key={"unitListDiv"}>
                <SharedUnitList unitAPI={unitAPI} onEdit={id => navigate(`/units/${id}/edit`)} onCreate={() => navigate("/units/0/edit")}/>
            </div>
    );
}
