import {useParams} from "react-router-dom";
import {type UIEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button, Col, Form, Input, Row, Select, Spin, Switch} from "antd";
import type {RuleObject} from "antd/es/form";
import {AclEdit} from "./AclEdit";
import {type EmbedDataProviders, RichTextEditor as RtEditor,} from '@vempain/vempain-rt-editor';
import {MetadataForm, SubmitResultHandler} from "../main";
import {dataAPI, formAPI, galleryAPI, pageAPI, siteFileAPI} from "../services";
import {ArrowDownOutlined, ArrowUpOutlined, MinusCircleOutlined} from "@ant-design/icons";
import {aclTool, type AclVO, ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";
import {type FileTypeEnum, type FormVO, type PageResponse, QueryDetailEnum, type SiteFilePagedRequest} from "../models";
import dayjs from "dayjs";

// Define the loading messages
const spinMessages: Record<string, string> = {
    loadingPageData: "Loading page data...",
    savingPageData: "Saving page data...",
    savingGalleryData: "Saving gallery data..."
};
const PAGE_OPTION_PAGE_SIZE = 50;

function toSiteFilePagedRequest(params: Record<string, string | number | boolean | undefined>): SiteFilePagedRequest {
    const page = params.page ?? params.page_number;
    const size = params.size ?? params.page_size;
    const fileType = params.file_type;

    if (typeof page !== "number" && typeof page !== "string") {
        throw new Error("Site file pagination requires a page number.");
    }
    if (typeof size !== "number" && typeof size !== "string") {
        throw new Error("Site file pagination requires a page size.");
    }
    if (typeof fileType !== "string") {
        throw new Error("Site file pagination requires a file type.");
    }

    return {
        page: Number(page),
        size: Number(size),
        sort_by: params.sort_by === "fileName" ? "file_name" : typeof params.sort_by === "string" ? params.sort_by : "file_name",
        direction: params.direction === "DESC" ? "DESC" : "ASC",
        search: typeof params.search === "string" ? params.search : typeof params.filter === "string" ? params.filter : undefined,
        file_type: fileType as FileTypeEnum,
        filter_column: params.filter_column === "fileName" ? "file_name" : typeof params.filter_column === "string" ? params.filter_column : "file_name",
    };
}

const defaultDataProviders: EmbedDataProviders = {
    findGalleries: (params) => galleryAPI.findAll({details: params.details}),
    getPagedSiteFiles: (params) => siteFileAPI.getPagedSiteFiles(toSiteFilePagedRequest(params)),
    getAllDataSets: (params) => dataAPI.getAllDataSets(params),
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

    const [page, setPage] = useState<PageResponse | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    const [formList, setFormList] = useState<FormVO[]>([]);
    const [pageList, setPageList] = useState<PageResponse[]>([]);
    const [pageListPage, setPageListPage] = useState(0);
    const [pageListSearch, setPageListSearch] = useState("");
    const [pageListHasMore, setPageListHasMore] = useState(false);
    const [pageOptionsLoading, setPageOptionsLoading] = useState(false);
    const pageOptionsRequestRef = useRef(0);
    const pageOptionsLoadingRef = useRef(false);
    const [selectedGalleries, setSelectedGalleries] = useState<GalleryList>({galleries: []});
    const [galleryList, setGalleryList] = useState<{ label: string, value: number }[]>([]);
    const selectedGalleryOptionsRef = useRef<{ label: string, value: number }[]>([]);
    const [galleryListPage, setGalleryListPage] = useState(0);
    const [galleryListSearch, setGalleryListSearch] = useState("");
    const [galleryListHasMore, setGalleryListHasMore] = useState(false);
    const [galleryOptionsLoading, setGalleryOptionsLoading] = useState(false);
    const galleryOptionsRequestRef = useRef(0);
    const galleryOptionsLoadingRef = useRef(false);

    const mergedDataProviders = useMemo<EmbedDataProviders>(
            () => defaultDataProviders,
            [],
    );

    const loadPageOptions = useCallback(async (pageNumber: number, search: string, append: boolean, force = false) => {
        if (pageOptionsLoadingRef.current && !force) {
            return;
        }

        const requestId = ++pageOptionsRequestRef.current;
        pageOptionsLoadingRef.current = true;
        setPageOptionsLoading(true);

        try {
            const response = await pageAPI.findPageable({
                page: pageNumber,
                size: PAGE_OPTION_PAGE_SIZE,
                sort_by: "page_path",
                direction: "ASC",
                search: search || undefined
            });

            if (requestId !== pageOptionsRequestRef.current) {
                return;
            }

            setPageList(current => append ? [...current, ...response.content] : response.content);
            setPageListPage(response.page);
            setPageListSearch(search);
            setPageListHasMore(!response.last);
        } catch (error) {
            if (requestId === pageOptionsRequestRef.current) {
                console.error("Error fetching page options:", error);
            }
        } finally {
            if (requestId === pageOptionsRequestRef.current) {
                pageOptionsLoadingRef.current = false;
                setPageOptionsLoading(false);
            }
        }
    }, []);

    function handlePageSearch(search: string): void {
        void loadPageOptions(0, search, false, true);
    }

    const loadGalleryOptions = useCallback(async (pageNumber: number, search: string, append: boolean, force = false) => {
        if (galleryOptionsLoadingRef.current && !force) {
            return;
        }

        const requestId = ++galleryOptionsRequestRef.current;
        galleryOptionsLoadingRef.current = true;
        setGalleryOptionsLoading(true);

        try {
            const response = await galleryAPI.findPageableWithoutFiles({
                page: pageNumber,
                size: PAGE_OPTION_PAGE_SIZE,
                sort_by: "short_name",
                direction: "ASC",
                search: search || undefined
            });

            if (requestId !== galleryOptionsRequestRef.current) {
                return;
            }

            const options = response.content.map((item) => ({label: item.short_name, value: item.id}));
            setGalleryList(current => {
                const candidates = append ? [...current, ...options] : [...selectedGalleryOptionsRef.current, ...options];
                return Array.from(new Map(candidates.map(option => [option.value, option])).values());
            });
            setGalleryListPage(response.page);
            setGalleryListSearch(search);
            setGalleryListHasMore(!response.last);
        } catch (error) {
            if (requestId === galleryOptionsRequestRef.current) {
                console.error("Error fetching gallery options:", error);
            }
        } finally {
            if (requestId === galleryOptionsRequestRef.current) {
                galleryOptionsLoadingRef.current = false;
                setGalleryOptionsLoading(false);
            }
        }
    }, []);

    function handleGallerySearch(search: string): void {
        void loadGalleryOptions(0, search, false, true);
    }

    function handleGalleryPopupScroll(event: UIEvent<HTMLDivElement>): void {
        const target = event.currentTarget;
        const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 8;
        if (atBottom && galleryListHasMore && !galleryOptionsLoadingRef.current) {
            void loadGalleryOptions(galleryListPage + 1, galleryListSearch, true);
        }
    }

    function handlePagePopupScroll(event: UIEvent<HTMLDivElement>): void {
        const target = event.currentTarget;
        const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 8;
        if (atBottom && pageListHasMore && !pageOptionsLoadingRef.current) {
            void loadPageOptions(pageListPage + 1, pageListSearch, true);
        }
    }

    useEffect(() => {
        setSpinTip(spinMessages.loadingPageData);
        setLoading(true);

        const tmpPageId: number = validateParamId(paramId);
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
            pageAPI.findPageable({page: 0, size: PAGE_OPTION_PAGE_SIZE, sort_by: "page_path", direction: "ASC"}),
            galleryAPI.findPageableWithoutFiles({page: 0, size: PAGE_OPTION_PAGE_SIZE, sort_by: "short_name", direction: "ASC"}),
            galleryAPI.findAllByPage({details: QueryDetailEnum.MINIMAL}, tmpPageId)
        ])
                .then((responses) => {
                    setFormList(responses[0]);
                    if (pageOptionsRequestRef.current === 0) {
                        setPageList(responses[1].content);
                        setPageListPage(responses[1].page);
                        setPageListSearch("");
                        setPageListHasMore(!responses[1].last);
                    }
                    if (galleryOptionsRequestRef.current === 0) {
                        const tmpAvailableGalleryList: { label: string, value: number }[] = responses[2].content.map((item) => ({
                            label: item.short_name,
                            value: item.id
                        }));
                        const selectedGalleryOptions = responses[3].map((item) => ({label: item.short_name, value: item.id}));
                        selectedGalleryOptionsRef.current = selectedGalleryOptions;
                        setGalleryList(Array.from(new Map([...selectedGalleryOptions, ...tmpAvailableGalleryList].map(option => [option.value, option])).values()));
                        setGalleryListPage(responses[2].page);
                        setGalleryListSearch("");
                        setGalleryListHasMore(!responses[2].last);
                    }
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
                            page_path: "",
                            secure: false,
                            index_list: false,
                            title: "",
                            header: "",
                            body: "",
                            acls: [],
                            locked: false,
                            creator: 0,
                            created: dayjs(),
                            modifier: 0,
                            modified: null,
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

    function onFinish(values: PageResponse): void {
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

        const galleryIds: number[] = values.galleries.map(gallery => gallery.value);

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

    function formValidation(_rule: RuleObject, value: number): Promise<void> {
        if (value > 0 && formList.filter(form => form.id === value).length > 0) {
            return Promise.resolve();
        }

        return Promise.reject("Please select a valid form");
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
            <div className={"DarkDiv"} style={{width: "99%"}}>
                <Spin description={spinTip} spinning={loading}>
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
                                    showSearch={true}
                                    filterOption={false}
                                    onSearch={handlePageSearch}
                                    onPopupScroll={handlePagePopupScroll}
                                    loading={pageOptionsLoading}
                                    options={[{label: 'None', value: 0}, ...pageList.map(p => ({label: p.page_path, value: p.id}))]}
                            />
                        </Form.Item>
                        <Form.Item name={"title"} label={"Title"}>
                            <Input/>
                        </Form.Item>
                        <Form.Item name={"header"} label={"Header"}>
                            <Input/>
                        </Form.Item>
                        <Form.Item name={"body"} label={"Body"}>
                            <RtEditor dataProviders={mergedDataProviders}/>
                        </Form.Item>
                        <Form.Item name={"page_path"} label={"Path"}>
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
                                                                                filterOption={false}
                                                                                onSearch={handleGallerySearch}
                                                                                onPopupScroll={handleGalleryPopupScroll}
                                                                                loading={galleryOptionsLoading}
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
