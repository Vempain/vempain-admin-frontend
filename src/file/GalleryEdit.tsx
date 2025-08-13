import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {SubmitResultHandler} from "../main";
import {Button, Col, Form, Input, Row, Select, Space, Spin} from "antd";
import {commonFileAPI, galleryAPI} from "../services";
import {AclEdit} from "../content";
import {ArrowDownOutlined, ArrowUpOutlined, MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {type GalleryRequest, QueryDetailEnum} from "../models";
import {aclTool, type AclVO, ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";

export function GalleryEdit() {
    const {paramId} = useParams();
    const [galleryId, setGalleryId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [gallery, setGallery] = useState<GalleryRequest>();
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [sendButtonText, setSendButtonText] = useState<string>("Update");
    const [acls, setAcls] = useState<AclVO[]>([]);

    const [galleryForm] = Form.useForm();

    const [availableCommonFiles, setAvailableCommonFiles] = useState<{ label: string, value: number }[]>([]);

    useEffect(() => {
        let tmpGalleryId: number = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setGalleryId(tmpGalleryId);

        Promise.all([
            tmpGalleryId > 0 ? galleryAPI.findById(tmpGalleryId, null) : Promise.resolve(null),
            commonFileAPI.findAll({details: QueryDetailEnum.MINIMAL})
        ])
                .then(([galleryResponse, commonFileResponse]) => {
                    if (galleryResponse) {
                        setGallery({
                            id: galleryResponse.id,
                            short_name: galleryResponse.short_name,
                            description: galleryResponse.description,
                            common_files_id: galleryResponse.common_files.map((item) => (item.id)),
                            acls: galleryResponse.acls
                        });
                        setAcls(galleryResponse.acls);
                    } else {
                        setGallery({
                            id: 0,
                            short_name: "",
                            description: "",
                            common_files_id: [],
                            acls: []
                        });
                        setSendButtonText("Create");
                    }

                    setAvailableCommonFiles(commonFileResponse.map((item) => ({label: item.converted_file, value: item.id})));
                })
                .catch((error) => {
                    console.error("Error:", error);
                    setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch data, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [paramId]);

    function onFinish(values: GalleryRequest) {
        // Go through the list of ACLs and set the undefined permission fields to false
        for (let i = 0; i < values.acls.length; i++) {
            aclTool.fillPermission(values.acls[i]);
        }

        setLoading(true);

        if (galleryId > 0) {
            galleryAPI.update(values)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Gallery updated"});
                    })
                    .catch((error) => {
                        console.error("Failed to update gallery:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update gallery"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            galleryAPI.create(values)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Gallery created"});
                    })
                    .catch((error) => {
                        console.error("Failed to create gallery:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create gallery"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    function filterOption(input: string, option?: { label: string; value: number }) {
        if (option && option.label) {
            return option.label.toLowerCase().includes(input.toLowerCase());
        }
        return false; // Return false for options without a label
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/galleries"} failTo={"/galleries"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/galleries"} failTo={"/galleries"}/>);
    }

    return (
            <div className={"darkBody"} key={"gallery-edit"}>
                <h4>{sendButtonText} Gallery {galleryId}</h4>
                <Spin spinning={loading}>
                    {!loading && gallery != null && <Form
                            form={galleryForm}
                            initialValues={gallery}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 22}}
                            style={{maxWidth: 1800}}
                            layout={"vertical"}
                            onFinish={onFinish}
                    >
                        <Form.Item
                                name={"id"}
                                label={"ID"}
                                hidden={true}
                        >
                            <Input type={"text"} disabled={true}/>
                        </Form.Item>
                        <Form.Item
                                name="short_name"
                                label="Short Name"
                                rules={[{required: true, message: "Please enter the short name"}]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item
                                name="description"
                                label="Description"
                                rules={[{required: true, message: "Please enter the description"}]}
                        >
                            <Input.TextArea/>
                        </Form.Item>
                        <Row gutter={16} align="middle">
                            <Col span={12}><strong>File</strong></Col>
                            <Col span={4}><strong>Action</strong></Col>
                        </Row>

                        <Form.List name="common_files_id">
                            {(commonFiles, {add, move, remove}) => (
                                    <>
                                        {commonFiles.map((_commonFile, index) => {
                                            const uniqueKey = `common_file-${index}`;
                                            return (
                                                    <Row gutter={16} align={"middle"} key={uniqueKey + "-row"}>
                                                        <Col span={12}>
                                                            <Form.Item
                                                                    name={[index]}
                                                                    key={uniqueKey + "-form-item"}
                                                                    rules={[{required: true, message: "Please select a common file"}]}
                                                            >
                                                                <Select
                                                                        options={availableCommonFiles}
                                                                        labelInValue={false}
                                                                        showSearch={true}
                                                                        key={uniqueKey + "-select"}
                                                                        filterOption={filterOption}
                                                                        placeholder={"Select a file"}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={4}>
                                                            <Button
                                                                    type={"primary"}
                                                                    onClick={() => move(index, (index - 1))}
                                                                    icon={<ArrowUpOutlined/>}
                                                                    disabled={index === 0 || commonFiles.length === 1}
                                                            />
                                                            <Button
                                                                    type={"primary"}
                                                                    onClick={() => move(index, (index + 1))}
                                                                    icon={<ArrowDownOutlined/>}
                                                                    disabled={index === commonFiles.length - 1 || commonFiles.length === 1}
                                                            />
                                                            <Button
                                                                    type={"primary"}
                                                                    danger={true}
                                                                    onClick={() => remove(index)}
                                                                    icon={<MinusCircleOutlined/>}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </Col>
                                                    </Row>);
                                        })}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined/>} style={{width: "100%"}}>
                                                Add file
                                            </Button>
                                        </Form.Item>
                                    </>
                            )}
                        </Form.List>
                        <Form.Item key={"gallery-acl-list"}
                                   label={"Access control"}
                        >
                            <AclEdit acls={acls} parentForm={galleryForm}/>
                        </Form.Item>
                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                            <Button
                                    type={"primary"}
                                    htmlType={"submit"}
                                    disabled={loading}
                            >{sendButtonText}</Button>
                            <Button
                                    type={"default"}
                                    htmlType={"reset"}
                                    disabled={loading}
                            >{"Reset"}</Button>
                        </Space>
                    </Form>}
                </Spin>
            </div>
    );
}