import {useEffect, useState} from "react";
import {Button, Form, Input, Spin, Switch} from "antd";
import {useParams} from "react-router-dom";
import {AclEdit} from "./AclEdit";
import {MetadataForm, SubmitResultHandler} from "../main";
import {layoutAPI} from "../services";
import {aclTool, validateParamId} from "../tools";
import {type AclVO, ActionResult, type SubmitResult} from "@vempain/vempain-auth-frontend";
import type {LayoutVO} from "../models";

export function LayoutEditor() {
    const {paramId} = useParams();
    const [layoutId, setLayoutId] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(false);
    const [layoutForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [layout, setLayout] = useState<LayoutVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    useEffect(() => {
        setLoading(true);
        let tmpLayoutId: number = validateParamId(paramId);
        setLayoutId(tmpLayoutId);
        if (tmpLayoutId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        if (tmpLayoutId > 0) {
            layoutAPI.findById(tmpLayoutId, null)
                    .then((response) => {
                        setLayout(response);
                        setAcls(response.acls);
                    })
                    .catch((error) => {
                        console.error("Error fetching:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the layout, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            setLayout({
                id: 0,
                layout_name: "",
                structure: "",
                acls: [],
                locked: false,
                creator: 0,
                created: new Date(),
                modifier: 0,
                modified: new Date(),
            });
            setLoading(false);
        }
    }, [paramId]);

    function onFinish(values: LayoutVO): void {
        console.debug("onFinish", values);

        for (let i = 0; i < values.acls.length; i++) {
            values.acls[i] = aclTool.completeAcl(values.acls[i]);
        }

        setLoading(true);

        if (layoutId === 0) {
            layoutAPI.create(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Layout created successfully"});
                        setLayout(response);
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create a new layout"});
                    });
        } else {
            layoutAPI.update(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Layout updated successfully"});
                        setLayout(response);
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update layout"});
                    });
        }

        setLoading(false);
        return;
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/layouts"} failTo={"/layouts"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/layouts"} failTo={"/layouts"}/>);
    }

    return (<div className={"darkBody"}>
                <Spin tip={"Loading"} spinning={loading}>
                    {layoutId === 0 && <h1>Create new layout</h1>}
                    {layoutId > 0 && <h1>Edit layout {layoutId}</h1>}
                    {layout !== null && <Form
                            form={layoutForm}
                            initialValues={layout}
                            onFinish={onFinish}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 18}}
                            style={{maxWidth: 1400}}
                            name={"PageForm"}
                            autoComplete="off"
                    >
                        <Form.Item name={"id"} label={"ID"}>
                            <Input disabled={true}/>
                        </Form.Item>
                        <Form.Item name="layout_name" label="Layout Name">
                            <Input/>
                        </Form.Item>
                        <Form.Item name="structure" label="Structure">
                            <Input.TextArea/>
                        </Form.Item>
                        <Form.Item name={"locked"} label={"Locked"} valuePropName={"checked"}>
                            <Switch/>
                        </Form.Item>
                        <Form.Item name={"acls"}
                                   key={"layout-acl-list"}
                                   label={"Access control"}
                        >
                            <AclEdit acls={acls} parentForm={layoutForm}/>
                        </Form.Item>
                        <Form.Item label={" "} colon={false} key={"page-metadata"}>
                            <MetadataForm metadata={{creator: layout.creator, created: layout.created, modifier: layout.modifier, modified: layout.modified}}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                            <Button type={"primary"} htmlType={"submit"}>Save</Button>
                        </Form.Item>
                    </Form>}
                </Spin>
            </div>
    );
}
