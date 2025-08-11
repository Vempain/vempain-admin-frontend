import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Button, Divider, Form, Input, Spin} from "antd";
import {SubmitResultHandler} from "../main";
import {AclEdit} from "../content";
import {type AclVO, ActionResult, type SubmitResult, type UnitVO} from "../models";
import {unitAPI} from "../services";
import {aclTool, validateParamId} from "../tools";

export function UnitEditor() {
    const {paramId} = useParams();
    const [unitId, setUnitId] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(false);
    const [unitForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [unit, setUnit] = useState<UnitVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    useEffect(() => {
        setLoading(true);

        let tmpUnitId: number = validateParamId(paramId);

        if (tmpUnitId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setUnitId(tmpUnitId);

        if (tmpUnitId > 0) {
            unitAPI.findById(tmpUnitId, null)
                    .then((response) => {
                        setUnit(response);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the unit, try again later"});
                    });
        } else {
            setUnit({
                id: 0,
                name: "",
                description: "",
                acls: [],
                creator: 0,
                created: new Date(),
                modifier: 0,
                modified: new Date(),
                locked: false
            });
            setLoading(false);
        }
    }, [paramId]);

    const handleAclsChange = (updatedAcls: AclVO[]) => {
        setAcls(updatedAcls);
    };

    function onFinish(values: UnitVO): void {
        for (let i = 0; i < values.acls.length; i++) {
            values.acls[i] = aclTool.completeAcl(values.acls[i]);
        }

        setLoading(true);

        if (unitId === 0) {
            unitAPI.create(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Unit created successfully"});
                        setUnit(response);
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create a new unit"});
                    });
        } else {
            unitAPI.update(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "Unit updated successfully"});
                        setUnit(response);
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update unit"});
                    });
        }

        setLoading(false);
        return;
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/units"} failTo={"/units"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/units"} failTo={"/units"}/>);
    }

    return (
            <div className={"darkBody"}>
                <Spin tip={"Loading"} spinning={loading}>
                    {unitId === 0 && <h1>Create new unit</h1>}
                    {unitId > 0 && <h1>Edit unit {unitId}</h1>}
                </Spin>
                {unit !== null && <Form
                        form={unitForm}
                        initialValues={unit}
                        onFinish={onFinish}
                        labelCol={{span: 8}}
                        wrapperCol={{span: 18}}
                        style={{maxWidth: 1400}}
                        name={"PageForm"}
                        autoComplete={"off"}
                >
                    <Form.Item name={"id"} label={"ID"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"name"} label={"Unit name"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"description"} label={"Description"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item key={"unit-acl-list"}
                               label={"Access control"}
                    >
                        <AclEdit acls={acls} onChange={handleAclsChange} parentForm={unitForm}/>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 8, span: 16,}}><Divider orientation={"left"}>Metadata</Divider></Form.Item>
                    <Form.Item name={"creator"} label={"Creator"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"created"} label={"Created"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"modifier"} label={"Modifier"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"modified"} label={"Modified"}>
                        <Input disabled={true}/>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                        <Button type={"primary"} htmlType={"submit"}>Save</Button>
                    </Form.Item>
                </Form>}
            </div>
    );
}
