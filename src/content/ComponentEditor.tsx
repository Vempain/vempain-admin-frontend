import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Button, Form, Input, Spin, Switch} from "antd";
import {MetadataForm, SubmitResultHandler} from "../main";
import {AclEdit} from "./AclEdit";
import {type AclVO, ActionResult, type ComponentVO, type SubmitResult} from "../models";
import {componentAPI} from "../services";
import {aclTool, validateParamId} from "../tools";

export function ComponentEditor() {
    const {paramId} = useParams<{ paramId: string }>();
    const [componentId, setComponentId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [componentForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [component, setComponent] = useState<ComponentVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    useEffect(() => {
        let tmpComponentId: number = validateParamId(paramId);

        if (tmpComponentId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setComponentId(tmpComponentId);

        setLoading(true);

        if (tmpComponentId > 0) {
            componentAPI.findById(tmpComponentId, null)
                    .then((response) => {
                        setComponent(response);
                    })
                    .catch((error) => {
                        console.error("Error fetching:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the component, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            setComponent({
                id: 0,
                comp_name: "",
                comp_data: "",
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

    const handleAclsChange = (updatedAcls: AclVO[]) => {
        setAcls(updatedAcls);
    };

    function onFinish(values: ComponentVO): void {
        console.debug("onFinish", values);

        for (let i = 0; i < values.acls.length; i++) {
            values.acls[i] = aclTool.completeAcl(values.acls[i]);
        }

        setLoading(true);

        if (componentId === 0) {
            componentAPI.create(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Component created successfully"});
                        setComponent(response);
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create a new component"});
                    });
        } else {
            componentAPI.update(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Component updated successfully"});
                        setComponent(response);
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update component"});
                    });
        }

        setLoading(false);
        return;
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/components"} failTo={"/components"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/components"} failTo={"/components"}/>);
    }

    return (
            <div className={"darkBody"}>
                <Spin tip={"Loading"} spinning={loading}>
                    {componentId === 0 && <h1>Create new component</h1>}
                    {componentId > 0 && <h1>Edit component {componentId}</h1>}
                    {component !== null && <Form
                            form={componentForm}
                            initialValues={component}
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
                        <Form.Item name="comp_name" label="Component Name">
                            <Input/>
                        </Form.Item>
                        <Form.Item name="comp_data" label="Component data">
                            <Input.TextArea/>
                        </Form.Item>
                        <Form.Item name={"locked"} label={"Locked"} valuePropName={"checked"}>
                            <Switch/>
                        </Form.Item>
                        <Form.Item name={"acls"}
                                   key={"component-acl-list"}
                                   label={"Access control"}
                        >
                            <AclEdit acls={acls} onChange={handleAclsChange} parentForm={componentForm}/>
                        </Form.Item>
                        <Form.Item label={" "} colon={false} key={"page-metadata"}>
                            <MetadataForm metadata={{
                                creator: component.creator,
                                created: component.created,
                                modifier: component.modifier,
                                modified: component.modified
                            }}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                            <Button type={"primary"} htmlType={"submit"}>Save</Button>
                        </Form.Item>
                    </Form>}
                </Spin>
            </div>
    );
}
