import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {type FormVO, type LayoutVO, type PageVO} from "../models";
import {SubmitResultHandler} from "../main";
import {formAPI, layoutAPI, pageAPI} from "../services";
import {Button, Spin} from "antd";
import {ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";

export function LayoutDelete() {
    const {paramId} = useParams();
    const [layoutId, setLayoutId] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [layout, setLayout] = useState<LayoutVO | null>(null);
    const [forms, setForms] = useState<FormVO[] | null>(null);
    const [pages, setPages] = useState<PageVO[]>([]);


    useEffect(() => {
        let tmpLayoutId: number = validateParamId(paramId);

        if (tmpLayoutId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setLayoutId(tmpLayoutId);

        if (tmpLayoutId > 0) {
            setLoading(true);
            // First we need to fetch the details of the layout we want to delete
            // Then we need to fetch the forms using the layout
            // And finally we need to figure out which pages are using those forms

            layoutAPI.findById(tmpLayoutId, null)
                    .then((response) => {
                        setLayout(response);
                        let tmpPageList: PageVO[] = [];


                        formAPI.findFormsByLayoutId(response.id)
                                .then((formResponse) => {
                                    setForms(formResponse);

                                    const pagePromises = formResponse.map(form =>
                                            pageAPI.findPagesByFormId(form.id)
                                                    .then((pageResponses) => {
                                                        if (pageResponses.length > 0) {
                                                            console.debug("pageResponse", pageResponses);
                                                            tmpPageList.push(...pageResponses);
                                                        }
                                                    })
                                                    .catch((error) => {
                                                        console.error("Error fetching list of pages using form:", error);
                                                        setLoadResults({
                                                            status: ActionResult.FAIL,
                                                            message: "Failed to fetch the list of pages using the form, try again later"
                                                        });
                                                    })
                                    );

                                    Promise.all(pagePromises)
                                            .then(() => {
                                                setPages(tmpPageList);
                                                setLoading(false);
                                            });
                                })
                                .catch((error) => {
                                    console.error("Error fetching list of forms using component:", error);
                                    setLoadResults({
                                        status: ActionResult.FAIL,
                                        message: "Failed to fetch the list of forms using the component, try again later"
                                    });
                                    setLoading(false);
                                });
                    })
                    .catch((error) => {
                        console.error("Error fetching layout details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch the layout details, try again later"});
                        setLoading(false);
                    });
        }
    }, [paramId]);


    function deleteLayout() {
        if (layout !== null) {
            layoutAPI.delete(layoutId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Layout deleted successfully"});
                    })
                    .catch((error) => {
                        console.error("Error deleting layout:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to delete the layout, try again later"});
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/components"} failTo={"/components"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/components"} failTo={"/components"}/>);
    }

    return (
            <div className={"darkBody"} key={"componentDeleteDiv"}>
                <Spin spinning={loading}>
                    <div>
                        <Button type={"primary"} danger={true} onClick={deleteLayout} key={"deleteButton"}>Delete layout</Button>
                    </div>
                    <p>
                        Deleting layout {layout?.layout_name} will also delete the following:
                    </p>

                    <h3 key={"formHeader"}>Forms</h3>

                    {!loading && forms?.map((form, index) => {
                        return (
                                <div key={"form" + index}>
                                    {form.id} {form.name}
                                </div>
                        );
                    })}
                    <h3 key={"pageHeader"}>Pages</h3>
                    {!loading && pages.map((page, index) => {
                        return (
                                <div key={"page" + index}>
                                    {page.id} {page.title}
                                </div>
                        );
                    })}
                </Spin>
            </div>
    );
}