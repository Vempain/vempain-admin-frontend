import { Alert, Button } from "antd";
import { ActionResult, SubmitResult } from "../models";

interface SubmitResultHandlerProps {
    submitResult: SubmitResult,
    successTo: string,
    failTo: string
}

function SubmitResultHandler({submitResult, successTo, failTo}: SubmitResultHandlerProps) {

    if (submitResult.status === ActionResult.OK) {
        return (
                <div className={"darkBody"}>
                    <Alert type={"success"}
                           showIcon
                           message={submitResult.message}
                           action={<Button type={"primary"} href={successTo}>Back</Button>}
                    />
                </div>
        );
    } else {
        return (
                <div className={"darkBody"}>
                    <Alert type={"error"}
                           showIcon
                           message={submitResult.message}
                           action={<Button type={"primary"} href={failTo}>Back</Button>}
                    />
                </div>
        );
    }
}

export { SubmitResultHandler };