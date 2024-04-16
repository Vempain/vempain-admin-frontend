import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button, Divider, Form, Input, Select, Space, Spin, Switch } from "antd";
import { MinusCircleFilled, PlusOutlined } from "@ant-design/icons";
import { SubmitResultHandler } from "../main";
import { AclEdit } from "./AclEdit";
import { AclVO, ComponentVO, FormVO, LayoutVO } from "../models/Responses";
import { ActionResult, SubmitResult } from "../models";
import { componentAPI, formAPI, layoutAPI } from "../services";
import { validateParamId } from "../tools";

export function FormEditor() {
    const {paramId} = useParams();
    const [formId, setFormId] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(false);
    const [formForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [form, setForm] = useState<FormVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});

    const [componentList, setComponentList] = useState<ComponentVO[]>([]);
    const [layoutList, setLayoutList] = useState<LayoutVO[]>([]);

    useEffect(() => {
        setLoading(true);

        Promise.all([
            componentAPI.findAll(),
            layoutAPI.findAll()
        ])
                .then((responses) => {
                    setComponentList(responses[0]);
                    setLayoutList(responses[1])
                })
                .catch((error) => {
                    console.error("Error fetching:", error);
                    setSubmitResults({status: ActionResult.FAIL, message: 'Failed to fetch the component and layout list, try again later'});
                });

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
            formAPI.findById(tmpFormId, null)
                    .then((response) => {
                        setForm(response);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to fetch the form, try again later'});
                        setLoading(false);

                    });
        } else {
            setForm({
                id: 0,
                name: '',
                layout_id: 0,
                components: [],
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

    function onFinish(values: FormVO): void {
        setLoading(true);

        if (formId === 0) {
            formAPI.create(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: 'Form created successfully'});
                        setForm(response);
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to create a new form'});
                    });
        } else {
            formAPI.update(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: 'Form updated successfully'});
                        setForm(response);
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to update form'});
                    });
        }

        setLoading(false);
        return;
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={'/forms'} failTo={'/forms'}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={'/forms'} failTo={'/forms'}/>);
    }

    return (
            <div className={'darkBody'}>
                <Spin tip={'Loading'} spinning={loading}>
                    {formId === 0 && <h1>Create new form</h1>}
                    {formId > 0 && <h1>Edit form {formId}</h1>}
                    {form !== null && <Form
                            form={formForm}
                            initialValues={form}
                            onFinish={onFinish}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 18}}
                            style={{maxWidth: 1400}}
                            name={'PageForm'}
                            autoComplete={'off'}
                    >
                        <Form.Item name={'id'} label={'ID'}>
                            <Input disabled={true}/>
                        </Form.Item>
                        <Form.Item name={'name'} label={'Form name'}>
                            <Input/>
                        </Form.Item>
                        <Form.Item name={'layout_id'} label={'Layout'}>
                            <Select
                                    placeholder={'Select a layout'}
                                    showSearch={true}
                            >
                                <Select.Option value={null} key={'empty'}>None</Select.Option>
                                {layoutList.map(layout => {
                                    return (
                                            <Select.Option key={layout.id} value={layout.id}>
                                                {layout.layout_name}
                                            </Select.Option>);
                                })}
                            </Select>
                        </Form.Item>


                        <Form.Item
                                label={'Components'}

                        >
                            <Form.List
                                    name="components"
                                    key="form-components"
                            >
                                {(components, {add, remove}) => {
                                    return (<>
                                        {components.map((field, index) => {
                                            return (
                                                    <Space key={field.key} style={{display: 'flex', marginBottom: 8}} align="baseline">
                                                        <Form.Item
                                                                name={[field.name, 'id']}
                                                                rules={
                                                                    [
                                                                        {
                                                                            required: true,
                                                                            message: 'Missing component'
                                                                        }
                                                                    ]
                                                                }
                                                        >
                                                            <Select
                                                                    placeholder="Select a component"
                                                                    showSearch
                                                                    optionFilterProp="children"
                                                                    style={{width: '300px'}}
                                                            >
                                                                <Select.Option value={'empty'} key="empty">
                                                                    None
                                                                </Select.Option>
                                                                {componentList.map(component => {
                                                                    return (
                                                                            <Select.Option key={component.id} value={component.id}>
                                                                                {component.comp_name}
                                                                            </Select.Option>);
                                                                })}
                                                            </Select>
                                                        </Form.Item>
                                                        <Button onClick={() => remove(field.name)}
                                                                type="text"
                                                                danger
                                                        ><MinusCircleFilled/></Button>
                                                    </Space>);
                                        })}
                                        <Form.Item>
                                            <Button
                                                    type="dashed"
                                                    onClick={() => add()}
                                                    block
                                                    icon={<PlusOutlined/>}
                                            >
                                                Add component
                                            </Button>
                                        </Form.Item>
                                    </>);
                                }}
                            </Form.List>
                        </Form.Item>

                        <Form.Item name={'locked'} label={'Locked'} valuePropName={'checked'}>
                            <Switch/>
                        </Form.Item>
                        <Form.Item key={'form-acl-list'}
                                   label={'Access control'}
                        >
                            <AclEdit acls={acls} onChange={handleAclsChange} parentForm={formForm}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}}><Divider orientation={'left'}>Metadata</Divider></Form.Item>
                        <Form.Item name={'creator'} label={'Creator'}>
                            <Input disabled={true}/>
                        </Form.Item>

                        <Form.Item name={'created'} label={'Created'}>
                            <Input disabled={true}/>
                        </Form.Item>

                        <Form.Item name={'modifier'} label={'Modifier'}>
                            <Input disabled={true}/>
                        </Form.Item>

                        <Form.Item name={'modified'} label={'Modified'}>
                            <Input disabled={true}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: 'center'}}>
                            <Button type={'primary'} htmlType={'submit'}>Save</Button>
                        </Form.Item>
                    </Form>}
                </Spin>
            </div>
    );
}
