import {Alert, Button} from "antd";
import {ActionResult, type SubmitResult} from "@vempain/vempain-auth-frontend";

interface SubmitResultHandlerProps {
    submitResult: SubmitResult,
    successTo: string,
    failTo: string
}

function SubmitResultHandler({submitResult, successTo, failTo}: SubmitResultHandlerProps) {

    if (submitResult.status === ActionResult.OK) {
        return (
                <div className={"darkBody"} key={"submitResultOkHandlerDiv"}>
                    <Alert type={"success"}
                           showIcon
                           message={submitResult.message}
                           action={<Button type={"primary"} href={successTo}>Back</Button>}
                           key={"submitResultHandlerSuccessAlert"}
                    />
                </div>
        );
    } else {
        return (
                <div className={"darkBody"} key={"submitResultFailHandlerDiv"}>
                    <Alert type={"error"}
                           showIcon
                           message={submitResult.message}
                           action={<Button type={"primary"} href={failTo}>Back</Button>}
                           key={"submitResultHandlerErrorAlert"}
                    />
                </div>
        );
    }
}

export { SubmitResultHandler };