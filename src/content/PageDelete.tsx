import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {ActionResult, type PageVO, type SubmitResult} from "../models";
import {validateParamId} from "../tools";
import {pageAPI} from "../services";
import {SubmitResultHandler} from "../main";
import {Button, Spin} from "antd";

export function PageDelete() {
    const {paramId} = useParams();
    const [pageId, setPageId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [page, setPage] = useState<PageVO | null>(null);

    useEffect(() => {
        let tmpPageId: number = validateParamId(paramId);

        if (tmpPageId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setPageId(tmpPageId);

        if (tmpPageId > 0) {
            setLoading(true);
            // First we need to fetch the details of the form we want to delete
            // Then we need to fetch the pages that uses the form

            pageAPI.findById(tmpPageId, null)
                    .then((response) => {
                        setPage(response);
                    })
                    .catch((error) => {
                        console.error("Error fetching page details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch the page details, try again later"});
                    })
                    .finally(() => {
                                setLoading(false);
                            }
                    );
        }
    }, [paramId]);

    function deletePage() {
        if (page !== null) {
            pageAPI.delete(pageId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Page deleted successfully"});
                    })
                    .catch((error) => {
                        console.error("Error deleting page:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to delete the page, try again later"});
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    return (
            <div className={"darkBody"} key={"componentDeleteDiv"}>
                <Spin spinning={loading}>
                    <div>
                        <Button type={"primary"} danger={true} onClick={deletePage} key={"deleteButton"}>Delete page</Button>
                    </div>
                </Spin>
            </div>
    );
}