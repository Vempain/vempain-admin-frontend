import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Button, Col, Form, Input, Row, Select, Spin, Switch} from "antd";
import {AclEdit} from "./AclEdit";
import TextArea from "antd/es/input/TextArea";
import {MetadataForm, SubmitResultHandler} from "../main";
import {formAPI, galleryAPI, pageAPI} from "../services";
import {ArrowDownOutlined, ArrowUpOutlined, MinusCircleOutlined} from "@ant-design/icons";
import {aclTool, type AclVO, ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";
import {type FormVO, type PageVO, QueryDetailEnum} from "../models";

// Define the loading messages
const spinMessages: Record<string, string> = {
    loadingPageData: "Loading page data...",
    savingPageData: "Saving page data...",
    savingGalleryData: "Saving gallery data..."
};

interface GalleryList {
    galleries: {
        label: string;
        value: number;
    }[];
}

export function PageEditor() {
    const {paramId} = useParams();
    const [pageId, setPageId] = useState<number>(0);
    const [pageTitle, setPageTitle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [pageForm] = Form.useForm();
    const [pageGalleryForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [spinTip, setSpinTip] = useState<string>(spinMessages.loadingPageData);

    const [page, setPage] = useState<PageVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    const [formList, setFormList] = useState<FormVO[]>([]);
    const [pageList, setPageList] = useState<PageVO[]>([]);
    const [selectedGalleries, setSelectedGalleries] = useState<GalleryList>({galleries: []});
    const [galleryList, setGalleryList] = useState<{ label: string, value: number }[]>([]);

    useEffect(() => {
        setSpinTip(spinMessages.loadingPageData);
        setLoading(true);

        let tmpPageId: number = validateParamId(paramId);
        setPageTitle(tmpPageId.toString());

        if (tmpPageId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setPageId(tmpPageId);

        Promise.all([
            formAPI.findAll({details: QueryDetailEnum.MINIMAL}),
            pageAPI.findAll({details: QueryDetailEnum.MINIMAL}),
            galleryAPI.findAll({details: QueryDetailEnum.MINIMAL}),
            galleryAPI.findAllByPage({details: QueryDetailEnum.MINIMAL}, tmpPageId)
        ])
                .then((responses) => {
                    setFormList(responses[0]);
                    setPageList(responses[1]);
                    const tmpAvailableGalleryList: { label: string, value: number }[] = responses[2].map((item) => ({label: item.short_name, value: item.id}));
                    console.log("Setting selected galleries:", tmpAvailableGalleryList);
                    setGalleryList(tmpAvailableGalleryList);
                    const tmpSelectedGalleryList: GalleryList = {galleries: responses[3].map((item) => ({label: item.short_name, value: item.id}))};
                    console.log("Setting selected galleries:", tmpSelectedGalleryList);
                    setSelectedGalleries(tmpSelectedGalleryList);

                    if (tmpPageId > 0) {
                        pageAPI.findById(tmpPageId, null)
                                .then((response) => {
                                    setPage(response);
                                    setPageTitle(response.title);
                                    setAcls(response.acls);
                                })
                                .catch((error) => {
                                    console.error("Error fetching:", error);
                                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the page, try again later"});
                                });
                    } else {
                        setPage({
                            id: 0,
                            parent_id: 0,
                            form_id: 0,
                            path: "",
                            secure: false,
                            index_list: false,
                            title: "",
                            header: "",
                            body: "",
                            acls: [],
                            locked: false,
                            creator: 0,
                            created: new Date(),
                            modifier: 0,
                            modified: new Date(),
                            published: null
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching:", error);
                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the form list, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [paramId]);

    function onFinish(values: PageVO): void {
        console.debug("onFinish", values);

        for (let i = 0; i < values.acls.length; i++) {
            values.acls[i] = aclTool.completeAcl(values.acls[i]);
        }

        setSpinTip(spinMessages.savingPageData);
        setLoading(true);

        if (pageId > 0) {
            pageAPI.update(values)
                    .then((response) => {
                        console.debug("Update response:", response);
                        setSubmitResults({status: ActionResult.OK, message: "Page updated"});
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update the page, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            pageAPI.create(values)
                    .then((response) => {
                        console.debug("Create response:", response);
                        setSubmitResults({status: ActionResult.OK, message: "Page created"});
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create the page, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    function onPageGalleryFinish(values: { galleries: { label: string, value: number }[] }): void {
        setSpinTip(spinMessages.savingGalleryData);
        setLoading(true);

        let galleryIds: number[] = values.galleries.map(gallery => gallery.value);

        galleryAPI.updatePageGalleries(pageId, galleryIds)
                .then((response) => {
                    console.debug("Update response:", response);

                    if (response.length === galleryIds.length) {
                        setSubmitResults({status: ActionResult.OK, message: "Galleries updated"});
                    } else {
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update the galleries, try again later"});
                    }
                })
                .catch((error) => {
                    console.error("Error updating:", error);
                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to update the galleries, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function formValidation(_rule: any, value: number): Promise<void> {
        if (value > 0 && formList.filter(form => form.id === value).length > 0) {
            return Promise.resolve();
        }

        return Promise.reject("Please select a valid form");
    }

    function filterOption(input: string, option?: { label: string; value: number }) {
        if (option && option.label) {
            return option.label.toLowerCase().includes(input.toLowerCase());
        }
        return false; // Return false for options without a label
    }

    function showPageGalleryForm() {
        console.debug("showPageGalleryForm", pageGalleryForm.getFieldValue("galleries"));
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/pages/" + paramId + "/edit"} failTo={"/pages/" + paramId + "/edit"}/>);
    }

    return (
            <div className={"DarkDiv"}>
                <Spin tip={spinTip} spinning={loading}>
                    {pageId === 0 && <h1>Create new page</h1>}
                    {pageId > 0 && <h1>Edit page '{pageTitle}'</h1>}
                    {page !== null && !loading && <Form
                            form={pageForm}
                            initialValues={page}
                            onFinish={onFinish}
                            labelCol={{span: 4}}
                            name={"PageForm"}
                            autoComplete={"off"}
                    >
                        <Form.Item name={"id"} label={"ID"}>
                            <Input disabled={true}/>
                        </Form.Item>
                        <Form.Item
                                name={"form_id"}
                                label={"Form"}
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select a form"
                                    },
                                    {
                                        validator: (rule, value) => formValidation(rule, value)
                                    }
                                ]}
                        >
                            <Select
                                    placeholder={"Select a form"}
                                    showSearch={true}
                            >
                                <Select.Option value={0} key={"emptyForm"}>None</Select.Option>
                                {formList.map(form => {
                                    return (
                                            <Select.Option key={form.id} value={form.id}>
                                                {form.name}
                                            </Select.Option>);
                                })}
                            </Select>
                        </Form.Item>
                        <Form.Item name={"parent_id"} label={"Parent Page"}>
                            <Select
                                    placeholder={"Select a parent page"}
                                    showSearch={{optionFilterProp: 'label', filterOption: filterOption}}
                                    options={[{label: 'None', value: 0}, ...pageList.map(p => ({label: p.path, value: p.id}))]}
                            />
                        </Form.Item>
                        <Form.Item name={"title"} label={"Title"}>
                            <Input/>
                        </Form.Item>
                        <Form.Item name={"header"} label={"Header"}>
                            <Input/>
                        </Form.Item>
                        <Form.Item name={"body"} label={"Body"}>
                            <TextArea autoSize={true}/>
                        </Form.Item>
                        <Form.Item name={"path"} label={"Path"}>
                            <Input/>
                        </Form.Item>

                        <Form.Item name={"locked"} label={"Locked"} valuePropName={"checked"}>
                            <Switch/>
                        </Form.Item>
                        <Form.Item key={"page-acl-list"}
                                   label={"Access control"}
                        >
                            <AclEdit acls={acls} parentForm={pageForm}/>
                        </Form.Item>
                        <Form.Item label={" "} colon={false} key={"page-metadata"}>
                            <MetadataForm metadata={{creator: page.creator, created: page.created, modifier: page.modifier, modified: page.modified}}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                            <Button type={"primary"} htmlType={"submit"}>Save page</Button>
                        </Form.Item>
                    </Form>}

                    {!loading && galleryList.length > 0 &&
                            <Form
                                    form={pageGalleryForm}
                                    initialValues={selectedGalleries}
                                    onFinish={onPageGalleryFinish}
                                    labelCol={{span: 4}}
                                    name={"PageGalleryForm"}
                                    autoComplete={"off"}
                            >
                                <Form.List
                                        name={"galleries"}
                                >
                                    {(fields, {add, move, remove}) => (
                                            <div>
                                                {fields.map((field, index) => {
                                                    const uniqueKey = `page_gallery-${index}`;

                                                    return (
                                                            <Row gutter={16} align={"middle"} key={uniqueKey + "-row"}>
                                                                <Col span={4}>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                            name={[field.key, "value"]}
                                                                            key={uniqueKey + "-select"}
                                                                            rules={[{required: true, message: "Please select a gallery"}]}
                                                                    >
                                                                        <Select
                                                                                options={galleryList}
                                                                                filterOption={filterOption}
                                                                                labelInValue={false}
                                                                                showSearch={true}
                                                                                key={uniqueKey + "-select"}
                                                                                placeholder={"Select a gallery"}
                                                                        />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={4}>
                                                                    <Button
                                                                            type={"primary"}
                                                                            onClick={() => move(index, (index - 1))}
                                                                            icon={<ArrowUpOutlined/>}
                                                                            disabled={index === 0 || fields.length === 1}
                                                                    />
                                                                    <Button
                                                                            type={"primary"}
                                                                            onClick={() => move(index, (index + 1))}
                                                                            icon={<ArrowDownOutlined/>}
                                                                            disabled={index === fields.length - 1 || fields.length === 1}
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

                                                <Form.Item wrapperCol={{offset: 8, span: 16,}}>
                                                    <Button
                                                            type={"dashed"}
                                                            onClick={() => add()}
                                                            style={{width: "100%"}}
                                                    >
                                                        Add Gallery
                                                    </Button>
                                                </Form.Item>
                                            </div>
                                    )}
                                </Form.List>
                                <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                                    <Button type={"primary"} onClick={showPageGalleryForm}>Check</Button>
                                    <Button type={"primary"} htmlType={"submit"}>Save list of galleries</Button>
                                </Form.Item>
                            </Form>
                    }
                </Spin>
            </div>
    );
}
