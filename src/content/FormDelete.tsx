import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { ActionResult, SubmitResult } from "../models";
import { FormVO, PageVO } from "../models/Responses";
import { SubmitResultHandler } from "../main";
import { Button, Spin } from "antd";
import { formAPI, pageAPI } from "../services";
import { validateParamId } from "../tools";

export function FormDelete() {
    const {paramId} = useParams();
    const [formId, setFormId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [form, setForm] = useState<FormVO | null>(null);
    const [pages, setPages] = useState<PageVO[]>([]);

    useEffect(() => {
        let tmpFormId: number = validateParamId(paramId);

        if (tmpFormId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: 'Called with invalid parameter'
            });
            return;
        }

        setFormId(tmpFormId);

        if (tmpFormId > 0) {
            setLoading(true);
            // First we need to fetch the details of the form we want to delete
            // Then we need to fetch the pages that uses the form

            formAPI.findById(tmpFormId, null)
                    .then((response) => {
                        setForm(response);

                        pageAPI.findPagesByFormId(response.id)
                                .then((pageResponses) => {
                                    setPages(pageResponses);
                                })
                                .catch((error) => {
                                    console.error("Error fetching list of pages using form:", error);
                                    setLoadResults({
                                        status: ActionResult.FAIL,
                                        message: 'Failed to fetch the list of pages using the form, try again later'
                                    });
                                    return []; // Return an empty array if there's an error
                                });
                    })
                    .catch((error) => {
                        console.error("Error fetching form details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: 'Failed to fetch the form details, try again later'});
                        setLoading(false);
                    })
                    .finally(() => {
                                setLoading(false);
                            }
                    );
        }
    }, [paramId]);

    function deleteForm() {
        if (form !== null) {
            formAPI.delete(formId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: 'Form deleted successfully'});
                    })
                    .catch((error) => {
                        console.error("Error deleting form:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to delete the form, try again later'});
                    });
        }
    }


    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={'/forms'} failTo={'/forms'}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={'/forms'} failTo={'/forms'}/>);
    }

    return (
            <div className={'darkBody'} key={'componentDeleteDiv'}>
                <Spin spinning={loading}>
                    <div>
                        <Button type={'primary'} danger={true} onClick={deleteForm} key={'deleteButton'}>Delete form</Button>
                    </div>

                    <p>
                        Deleting component {form?.name} will also delete the following:
                    </p>

                    <h3 key={"pageHeader"}>Pages</h3>
                    {!loading && pages.map((page, index) => {
                        return (
                                <div key={'page' + index}>
                                    {page.id} {page.title}
                                </div>
                        );
                    })}
                </Spin>
            </div>
    );
}