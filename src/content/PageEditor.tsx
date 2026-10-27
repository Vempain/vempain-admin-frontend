import {useParams} from "react-router-dom";
import {type UIEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button, Form, Input, Select, Spin, Switch, Tag, Typography} from "antd";
import type {RuleObject} from "antd/es/form";
import {AclEdit} from "./AclEdit";
import {PagePathInput} from "./PagePathInput";
import {
    type DataSetQueryParams,
    type EmbedDataProviders,
    type EmbedDescriptor,
    RichTextEditor as RtEditor,
    type SiteFileQueryParams,
} from '@vempain/vempain-rt-editor';
import {MetadataForm, SubmitResultHandler} from "../main";
import {dataAPI, formAPI, galleryAPI, pageAPI, siteFileAPI, webSiteManagementAPI} from "../services";
import {aclTool, type AclVO, ActionResult, type SubmitResult, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import {type FileTypeEnum, type FormVO, type PageRequest, type PageResponse, type SiteFilePagedRequest} from "../models";
import dayjs from "dayjs";
import {galleryIdsFromEmbeds, sameGalleryIds, sanitizeRichText, toInternalLinkTarget} from "../tools";

// Define the loading messages
const spinMessages: Record<string, string> = {
    loadingPageData: "Loading page data...",
    savingPageData: "Saving page data..."
};
const PAGE_OPTION_PAGE_SIZE = 50;

function toSiteFilePagedRequest(params: SiteFileQueryParams): SiteFilePagedRequest {
    const page = params.page;
    const size = params.size;
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
        search: params.search,
        file_type: fileType as FileTypeEnum,
        filter_column: params.filter_column === "fileName" ? "file_name" : typeof params.filter_column === "string" ? params.filter_column : "file_name",
    };
}

const defaultDataProviders: EmbedDataProviders = {
    findGalleries: (params) => galleryAPI.findPageableList(params),
    getPagedSiteFiles: (params) => siteFileAPI.getPagedSiteFiles(toSiteFilePagedRequest(params)),
    getAllDataSets: (params?: DataSetQueryParams) => dataAPI.getAllDataSets(params),
    // The link dialog offers only what is published on the website, as hrefs of the website's page and file routes
    findInternalLinks: ({search, limit}) => webSiteManagementAPI.findInternalLinks(search, limit).then(links => links.map(toInternalLinkTarget)),
};

export function PageEditor() {
    const {paramId} = useParams();
    const {userSession} = useSession();
    const [pageId, setPageId] = useState<number>(0);
    const [pageTitle, setPageTitle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [pageForm] = Form.useForm();
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
    // The galleries the body embeds (gallery and hero carousel embeds), reported by the editor; saved with the page as its gallery links
    const [galleryIds, setGalleryIds] = useState<number[]>([]);
    const [galleryNames, setGalleryNames] = useState<Record<number, string>>({});

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

    const handleEmbedsChange = useCallback((embeds: EmbedDescriptor[]) => {
        const next = galleryIdsFromEmbeds(embeds);
        setGalleryIds(current => sameGalleryIds(current, next) ? current : next);
    }, []);

    // Resolve the names of the embedded galleries for the summary; an unreadable or missing gallery is shown by its id
    useEffect(() => {
        const missing = galleryIds.filter(id => galleryNames[id] === undefined);

        if (missing.length === 0) {
            return;
        }

        let cancelled = false;
        Promise.all(missing.map(id => galleryAPI.findById(id, null)
                .then(gallery => [id, gallery.short_name] as const)
                .catch(() => [id, `#${id}`] as const)))
                .then(entries => {
                    if (!cancelled) {
                        setGalleryNames(current => ({...current, ...Object.fromEntries(entries)}));
                    }
                });

        return () => {
            cancelled = true;
        };
    }, [galleryIds, galleryNames]);

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
            formAPI.findPageable({page: 0, size: PAGE_OPTION_PAGE_SIZE, sort_by: "name", direction: "ASC"}),
            pageAPI.findPageable({page: 0, size: PAGE_OPTION_PAGE_SIZE, sort_by: "page_path", direction: "ASC"})
        ])
                .then((responses) => {
                    setFormList(responses[0].content);
                    if (pageOptionsRequestRef.current === 0) {
                        setPageList(responses[1].content);
                        setPageListPage(responses[1].page);
                        setPageListSearch("");
                        setPageListHasMore(!responses[1].last);
                    }

                    if (tmpPageId > 0) {
                        pageAPI.findById(tmpPageId, null)
                                .then((response) => {
                                    setPage({...response, body: sanitizeRichText(response.body)});
                                    setPageTitle(response.title);
                                    setAcls(response.acls);
                                })
                                .catch((error) => {
                                    console.error("Error fetching:", error);
                                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the page, try again later"});
                                });
                    } else {
                        // A new page starts with the current user holding every privilege, so that the creator never locks themselves out
                        const defaultAcls: AclVO[] = userSession?.id ? [{
                            permission_id: 0,
                            acl_id: 0,
                            user: Number(userSession.id),
                            unit: null,
                            create_privilege: true,
                            read_privilege: true,
                            modify_privilege: true,
                            delete_privilege: true
                        }] : [];
                        setAcls(defaultAcls);
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
                            tags: [],
                            acls: defaultAcls,
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
    }, [paramId, userSession?.id]);

    function onFinish(values: PageResponse): void {
        console.debug("onFinish", values);
        // The gallery links travel with the page: the backend replaces them with the galleries the body embeds
        const safeValues: PageRequest = {...values, body: sanitizeRichText(values.body), gallery_ids: galleryIds};

        for (let i = 0; i < safeValues.acls.length; i++) {
            safeValues.acls[i] = aclTool.completeAcl(safeValues.acls[i]);
        }

        setSpinTip(spinMessages.savingPageData);
        setLoading(true);

        if (pageId > 0) {
            pageAPI.update(safeValues)
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
            pageAPI.create(safeValues)
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

    function formValidation(_rule: RuleObject, value: number): Promise<void> {
        if (value > 0 && formList.filter(form => form.id === value).length > 0) {
            return Promise.resolve();
        }

        return Promise.reject("Please select a valid form");
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/pages"} failTo={"/pages"}/>);
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
                        <Form.Item name={"tags"} label={"Tags"} tooltip={"Published to the website with the page and shown next to its title"}>
                            <Select mode={"tags"} tokenSeparators={[","]} placeholder={"Type a tag and press Enter"} aria-label={"Tags"}
                                    open={false}/>
                        </Form.Item>
                        <Form.Item name={"body"} label={"Body"}>
                            <RtEditor dataProviders={mergedDataProviders} onEmbedsChange={handleEmbedsChange}/>
                        </Form.Item>
                        <Form.Item label={"Galleries"} key={"page-galleries"}
                                   tooltip={"The galleries embedded in the body are linked to the page and published with it"}>
                            {galleryIds.length === 0 && <Typography.Text type={"secondary"}>No galleries embedded in the body</Typography.Text>}
                            {galleryIds.map(id => <Tag key={id} data-testid={"page-gallery-" + id}>{galleryNames[id] ?? `#${id}`}</Tag>)}
                        </Form.Item>
                        <Form.Item name={"page_path"} label={"Path"}>
                            <PagePathInput/>
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

                </Spin>
            </div>
    );
}
