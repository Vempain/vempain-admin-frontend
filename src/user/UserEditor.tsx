import {useNavigate, useParams} from "react-router-dom";
import {ActionResult, type SubmitResult, UserEditor as SharedUserEditor, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import {MetadataForm, SubmitResultHandler} from "../main";
import {unitAPI, userAPI} from "../services";

/**
 * Route host of the shared user editor: `/users/:paramId/edit` (0 creates). Saving returns to the list.
 */
export function UserEditor() {
    const {paramId} = useParams();
    const navigate = useNavigate();
    const {userSession} = useSession();
    const userId = validateParamId(paramId);

    if (userId < 0) {
        const failure: SubmitResult = {status: ActionResult.FAIL, message: "Called with invalid parameter"};
        return (<SubmitResultHandler submitResult={failure} successTo={"/users"} failTo={"/users"}/>);
    }

    return (
            <div className={"DarkDiv"}>
                <SharedUserEditor userAPI={userAPI}
                                  unitAPI={unitAPI}
                                  userId={userId}
                                  currentUserId={userSession?.id ? Number(userSession.id) : undefined}
                                  onSaved={() => navigate("/users")}
                                  onCancel={() => navigate("/users")}
                                  renderMetadata={metadata => <MetadataForm metadata={metadata}/>}/>
            </div>
    );
}
