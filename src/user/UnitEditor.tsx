import {useNavigate, useParams} from "react-router-dom";
import {ActionResult, type SubmitResult, UnitEditor as SharedUnitEditor, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import {MetadataForm, SubmitResultHandler} from "../main";
import {unitAPI, userAPI} from "../services";

/**
 * Route host of the shared unit editor: `/units/:paramId/edit` (0 creates). Members and nesting are edited in the shared component,
 * which refuses circular nesting before the backend does.
 */
export function UnitEditor() {
    const {paramId} = useParams();
    const navigate = useNavigate();
    const {userSession} = useSession();
    const unitId = validateParamId(paramId);

    if (unitId < 0) {
        const failure: SubmitResult = {status: ActionResult.FAIL, message: "Called with invalid parameter"};
        return (<SubmitResultHandler submitResult={failure} successTo={"/units"} failTo={"/units"}/>);
    }

    return (
            <div className={"DarkDiv"}>
                <SharedUnitEditor unitAPI={unitAPI}
                                  userAPI={userAPI}
                                  unitId={unitId}
                                  currentUserId={userSession?.id ? Number(userSession.id) : undefined}
                                  onSaved={() => navigate("/units")}
                                  onCancel={() => navigate("/units")}
                                  renderMetadata={metadata => <MetadataForm metadata={metadata}/>}/>
            </div>
    );
}
