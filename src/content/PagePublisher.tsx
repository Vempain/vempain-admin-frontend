import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { validateParamId } from "../tools";
import { ActionResult, SubmitResult } from "../models";
import { PageVO } from "../models/Responses";
import { pageAPI } from "../services";
import { Button, Space, Spin } from "antd";
import { SubmitResultHandler } from "../main";
import TextArea from "antd/es/input/TextArea";

export function PagePublisher() {
    const {paramId} = useParams();
    const [pageId, setFpageId] = useState<number>(0);
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

        setFpageId(tmpPageId);

        setLoading(true);
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
    }, [paramId]);

    function publishPage() {
        if (page !== null) {
            setLoading(true);
            pageAPI.publish(pageId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Page published successfully"});
                    })
                    .catch((error) => {
                        console.error("Error publishing page:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to publish the page, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
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
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading} tip={"Uploading page and files..."}>
                    {page !== null && page.body !== undefined && <div>
                        <Space direction={"vertical"} size={"large"}>
                            <TextArea key={"pageBody"} value={page.body} style={{width: 800, height: "100%"}}/>
                            <Button key={"publishButton"} type={"primary"} onClick={publishPage}>Publish page</Button>
                        </Space>
                    </div>}
                </Spin>
            </div>
    );
}
