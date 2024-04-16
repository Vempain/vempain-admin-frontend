import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { SubmitResultHandler } from "../main";
import { ActionResult, SubmitResult } from "../models";
import { ComponentVO, FormVO, PageVO } from "../models/Responses";
import { componentAPI, formAPI, pageAPI } from "../services";
import { Button, Spin } from "antd";
import { validateParamId } from "../tools";

export function ComponentDelete() {
    const {paramId} = useParams();
    const [componentId, setComponentId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [component, setComponent] = useState<ComponentVO | null>(null);
    const [forms, setForms] = useState<FormVO[] | null>(null);
    const [pages, setPages] = useState<PageVO[]>([]);

    useEffect(() => {
        let tmpComponentId: number = validateParamId(paramId);

        if (tmpComponentId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: 'Called with invalid parameter'
            });
            return;
        }

        setComponentId(tmpComponentId);

        if (tmpComponentId > 0) {
            setLoading(true);
            // First we need to fetch the details of the component we want to delete
            // Then we need to fetch the form that the component belongs to
            // And finally we need to figure out which pages are using that form

            componentAPI.findById(tmpComponentId, null)
                    .then((response) => {
                        setComponent(response);
                        let tmpPageList: PageVO[] = [];

                        formAPI.findFormsByComponentId(response.id)
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
                                                            message: 'Failed to fetch the list of pages using the form, try again later'
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
                                        message: 'Failed to fetch the list of forms using the component, try again later'
                                    });
                                    setLoading(false);
                                });
                    })
                    .catch((error) => {
                        console.error("Error fetching component details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: 'Failed to fetch the component details, try again later'});
                        setLoading(false);
                    });
        }
    }, [paramId]);

    function deleteComponent() {
        if (component !== null) {
            componentAPI.delete(componentId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: 'Component deleted successfully'});
                    })
                    .catch((error) => {
                        console.error("Error deleting component:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to delete the component, try again later'});
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={'/components'} failTo={'/components'}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={'/components'} failTo={'/components'}/>);
    }

    return (
            <div className={'darkBody'} key={'componentDeleteDiv'}>
                <Spin spinning={loading}>
                    <div>
                        <Button type={'primary'} danger={true} onClick={deleteComponent} key={'deleteButton'}>Delete component</Button>
                    </div>

                    <p>
                        Deleting component {component?.comp_name} will also delete the following:
                    </p>

                    <h3 key={"formHeader"}>Forms</h3>

                    {!loading && forms?.map((form, index) => {
                        return (
                                <div key={'form' + index}>
                                    {form.id} {form.name}
                                </div>
                        );
                    })}
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
