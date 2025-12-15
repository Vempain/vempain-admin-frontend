import {useParams} from "react-router-dom";
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {SubmitResultHandler} from "../main";
import {Button, Form, Input, Select, Space, Spin, Switch, Transfer, Typography} from "antd";
import type {TransferProps} from "antd/es/transfer";
import VirtualList from "rc-virtual-list";
import {galleryAPI, siteFileAPI} from "../services";
import {AclEdit} from "../content";
import type {SiteFileResponse} from "../models";
import {FileTypeEnum, type GalleryRequest, type GalleryVO} from "../models";
import {aclTool, type AclVO, ActionResult, SortDirectionEnum, type SubmitResult, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import dayjs from "dayjs";

const PAGE_SIZE = 50;

interface SiteFileTransferItem {
    key: string;
    file: SiteFileResponse;
}

const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
};

export function GalleryEdit() {
    const {userSession} = useSession();
    const {paramId} = useParams();
    const [galleryId, setGalleryId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [gallery, setGallery] = useState<GalleryVO>();
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [sendButtonText, setSendButtonText] = useState<string>("Update");
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [siteFilesLoading, setSiteFilesLoading] = useState(false);
    const [siteFilesSearchInput, setSiteFilesSearchInput] = useState("");
    const [siteFilesFilter, setSiteFilesFilter] = useState("");
    const [siteFilesFilterColumn, setSiteFilesFilterColumn] = useState("");
    const [selectedFileType, setSelectedFileType] = useState<FileTypeEnum>(FileTypeEnum.IMAGE);
    const [siteFilesSortBy, setSiteFilesSortBy] = useState("id");
    const [siteFilesSortDirection, setSiteFilesSortDirection] = useState<SortDirectionEnum>(SortDirectionEnum.ASC);
    const [siteFilesCaseSensitive, setSiteFilesCaseSensitive] = useState(false);

    const [galleryForm] = Form.useForm();

    const [siteFileMap, setSiteFileMap] = useState<Map<number, SiteFileResponse>>(() => new Map());
    const [selectedSiteFileIds, setSelectedSiteFileIds] = useState<number[]>([]);
    const selectedSiteFileIdsRef = useRef<number[]>([]);

    const searchAndFilterOptions = [
        {label: "File name", value: "filename"},
        {label: "File path", value: "filepath"},
        {label: "Mime type", value: "mimetype"},
        {label: "Created", value: "created"},
        {label: "Modified", value: "modified"},
        {label: "Subject", value: "subject"},
        {label: "Size", value: "size"}
    ];

    // Loop through all FileTypeEnum values to create options

    const siteFileTypeOptions = useMemo(() => {
        const options = [];
        for (const value in FileTypeEnum) {
            options.push({label: value.charAt(0) + value.slice(1).toLowerCase(), value: FileTypeEnum[value as keyof typeof FileTypeEnum]});
        }
        return options;
    }, []);

    const hydrateSiteFiles = useCallback((files: SiteFileResponse[]) => {
        if (files.length === 0) {
            return;
        }
        setSiteFileMap((prev) => {
            const next = new Map(prev);
            files.forEach((file) => next.set(file.id, file));
            return next;
        });
    }, []);

    const applySelectedSiteFiles = useCallback((files: SiteFileResponse[]) => {
        const ids = files.map((file) => file.id);
        setSelectedSiteFileIds(ids);
        selectedSiteFileIdsRef.current = ids;
        galleryForm.setFieldsValue({site_files_id: ids});
        hydrateSiteFiles(files);
    }, [galleryForm, hydrateSiteFiles]);

    const fetchSiteFiles = useCallback((page = 0, append = false) => {
        setSiteFilesLoading(true);
        const params = {
            page_size: PAGE_SIZE,
            page_number: page,
            sort_by: siteFilesSortBy,
            direction: siteFilesSortDirection,
            filter: siteFilesFilter || undefined,
            filter_column: siteFilesFilterColumn,
            case_sensitive: siteFilesCaseSensitive,
            file_type: selectedFileType
        };

        siteFileAPI.getPagedSiteFiles(params)
                .then((response) => {
                    setCurrentPage(response.page);
                    setTotalPages(response.total_pages);
                    setTotalElements(response.total_elements);

                    setSiteFileMap((prev) => {
                        const next = append ? new Map(prev) : new Map();
                        response.content.forEach((file) => next.set(file.id, file));
                        if (!append) {
                            selectedSiteFileIdsRef.current.forEach((id) => {
                                const cached = prev.get(id);
                                if (cached) {
                                    next.set(id, cached);
                                }
                            });
                        }
                        return next;
                    });

                    if (!append && response.empty && siteFilesFilter.length === 0) {
                        setLoadResults({status: ActionResult.FAIL, message: "No site files found, cannot proceed"});
                    }
                })
                .catch((error) => {
                    console.error("Failed to fetch site files page info:", error);
                })
                .finally(() => {
                    setSiteFilesLoading(false);
                });
    }, [siteFilesSortBy, siteFilesSortDirection, siteFilesFilter, siteFilesCaseSensitive, selectedFileType]);

    useEffect(() => {
        void fetchSiteFiles(0, false);
    }, [fetchSiteFiles]);

    useEffect(() => {
        let userId = userSession?.id ?? 0;
        const tmpGalleryId = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({status: ActionResult.FAIL, message: "Called with invalid parameter"});
            setLoading(false);
            return;
        }

        setGalleryId(tmpGalleryId);
        setLoading(true);
        setSiteFileMap(new Map());

        const galleryPromise = tmpGalleryId > 0 ? galleryAPI.findById(tmpGalleryId, null) : Promise.resolve(null);

        galleryPromise.then((galleryResponse) => {
            if (galleryResponse) {
                setGallery(galleryResponse);
                setAcls(galleryResponse.acls);
                applySelectedSiteFiles(galleryResponse.site_files);
            } else {
                const base: GalleryVO = {
                    id: 0,
                    acls: [],
                    locked: false,
                    creator: userId,
                    created: dayjs(),
                    modifier: null,
                    modified: null,
                    short_name: "",
                    description: "",
                    site_files: []
                };
                setGallery(base);
                setSendButtonText("Create");
                applySelectedSiteFiles([]);
            }
        }).catch((error) => {
            console.error("Failed to load gallery:", error);
            setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch gallery"});
        }).finally(() => {
            setLoading(false);
        });
    }, [paramId, userSession?.id, applySelectedSiteFiles]);

    const transferDataSource = useMemo(() => Array.from(siteFileMap.values()).map((file) => ({
        key: String(file.id),
        file
    })), [siteFileMap]);

    const transferTargetKeys = useMemo(() => selectedSiteFileIds.map((id) => String(id)), [selectedSiteFileIds]);

    const handleTransferChange: TransferProps<SiteFileTransferItem>["onChange"] = (nextTargetKeys) => {
        const ids = nextTargetKeys.map((value) => Number(value));
        setSelectedSiteFileIds(ids);
        selectedSiteFileIdsRef.current = ids;
        galleryForm.setFieldsValue({site_files_id: ids});
    };

    const transferFilter = (_input: string, item: SiteFileTransferItem) => {
        return item.file.file_name.toLowerCase().includes(_input.toLowerCase());
    };

    const renderTransferItem = (item: SiteFileTransferItem) => (
            <div style={{display: "flex", flexDirection: "column"}}>
                <Typography.Text strong>{item.file.file_name}</Typography.Text>
                <Typography.Text type="secondary" style={{fontSize: 12}}>
                    ID: {item.file.id} · {item.file.file_type} · {formatFileSize(item.file.size)}
                </Typography.Text>
            </div>
    );

    const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {value} = event.target;
        setSiteFilesSearchInput(value);

        if (value === "") {
            setSiteFilesFilter("");
        }
    };

    const handleSearchSubmit = (value: string) => {
        setSiteFilesFilter(value.trim());
    };

    const handleSortByChange = (value: string) => {
        setSiteFilesSortBy(value);
    };

    const handleFileTypeChange = (value: string) => {
        const filetype = FileTypeEnum[value as keyof typeof FileTypeEnum];
        setSelectedFileType(filetype);
    };

    const handleSearchColumnChange = (value: string) => {
        setSiteFilesFilterColumn(value);
    };

    const handleDirectionChange = (value: SortDirectionEnum) => {
        setSiteFilesSortDirection(value);
    };

    const handleCaseSensitiveChange = (checked: boolean) => {
        setSiteFilesCaseSensitive(checked);
    };

    function handleLoadMoreResources() {
        if (!siteFilesLoading && currentPage + 1 < totalPages) {
            void fetchSiteFiles(currentPage + 1, true);
        }
    }

    function onFinish(values: GalleryRequest) {
        for (let i = 0; i < values.acls.length; i++) {
            aclTool.fillPermission(values.acls[i]);
        }
        const payload: GalleryRequest = {
            ...values,
            site_files_id: selectedSiteFileIds
        };

        setLoading(true);

        const operation = galleryId > 0 ? galleryAPI.update(payload) : galleryAPI.create(payload);
        operation.then(() => {
            setSubmitResults({status: ActionResult.OK, message: galleryId > 0 ? "Gallery updated" : "Gallery created"});
        }).catch((error) => {
            console.error("Failed to save gallery:", error);
            setSubmitResults({status: ActionResult.FAIL, message: galleryId > 0 ? "Failed to update gallery" : "Failed to create gallery"});
        }).finally(() => {
            setLoading(false);
        });
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo="/galleries" failTo="/galleries"/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo="/galleries" failTo="/galleries"/>);
    }

    return (
            <div className="DarkDiv" key="gallery-edit">
                <h4>{sendButtonText} Gallery {galleryId}</h4>
                <Spin spinning={loading}>
                    {!loading && gallery != null && <Form
                            form={galleryForm}
                            initialValues={gallery}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 22}}
                            style={{maxWidth: 1800, padding: 20}}
                            layout="vertical"
                            onFinish={onFinish}
                    >
                        <Form.Item name="id" label="ID" hidden>
                            <Input type="text" disabled/>
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

                        <Form.Item label="Site Files">
                            <Space wrap style={{marginBottom: 12}}>
                                <Input.Search
                                        value={siteFilesSearchInput}
                                        allowClear
                                        onChange={handleSearchInputChange}
                                        onSearch={handleSearchSubmit}
                                        style={{width: 240}}
                                        placeholder="Search site files"
                                />
                                <Select
                                        value={siteFilesSortBy}
                                        onChange={handleSortByChange}
                                        style={{width: 180}}
                                        options={searchAndFilterOptions}
                                        placeholder="Sort by"
                                />
                                <Select
                                        value={siteFilesFilterColumn}
                                        onChange={handleSearchColumnChange}
                                        style={{width: 160}}
                                        options={searchAndFilterOptions}
                                        placeholder="Filter column"
                                />
                                <Select
                                        value={selectedFileType}
                                        onChange={handleFileTypeChange}
                                        style={{width: 160}}
                                        options={siteFileTypeOptions}
                                        placeholder="File type"
                                />
                                <Select
                                        value={siteFilesSortDirection}
                                        onChange={handleDirectionChange}
                                        style={{width: 160}}
                                        options={[
                                            {label: "Ascending", value: SortDirectionEnum.ASC},
                                            {label: "Descending", value: SortDirectionEnum.DESC}
                                        ]}
                                        placeholder="Sort direction"
                                />
                                <Space>
                                    <Typography.Text>Case sensitive</Typography.Text>
                                    <Switch checked={siteFilesCaseSensitive} onChange={handleCaseSensitiveChange}/>
                                </Space>
                            </Space>
                            <Spin spinning={siteFilesLoading}>
                                <Transfer<SiteFileTransferItem>
                                        dataSource={transferDataSource}
                                        targetKeys={transferTargetKeys}
                                        onChange={handleTransferChange}
                                        showSearch={true}
                                        showSelectAll={true}
                                        oneWay={selectedSiteFileIds.length === 0}
                                        filterOption={transferFilter}
                                        render={(item) => item.file.file_name}
                                        titles={["Available files", "Assigned files"]}
                                        style={{width: "100%", backgroundColor: "#303030"}}
                                        locale={{itemUnit: "file", itemsUnit: "files"}}
                                >
                                    {({onItemSelect, selectedKeys, filteredItems}) => (
                                            <VirtualList
                                                    data={filteredItems}
                                                    height={420}
                                                    itemHeight={56}
                                                    itemKey="key"
                                                    style={{height: 420, overflow: "auto"}}
                                            >
                                                {(item) => {
                                                    const checked = selectedKeys.includes(item.key);
                                                    return (
                                                            <div
                                                                    key={item.key}
                                                                    className="virtual-transfer-item"
                                                                    style={{padding: 12, cursor: "pointer", display: "flex", alignItems: "center"}}
                                                                    onClick={() => onItemSelect(item.key, !checked)}
                                                                    role="option"
                                                                    aria-selected={checked}
                                                            >
                                                                <input type="checkbox" readOnly checked={checked} style={{marginRight: 12}}/>
                                                                {renderTransferItem(item)}
                                                            </div>
                                                    );
                                                }}
                                            </VirtualList>
                                    )}
                                </Transfer>
                            </Spin>
                            <Space wrap style={{marginTop: 12}}>
                                {currentPage + 1 < totalPages && (
                                        <Button onClick={handleLoadMoreResources} loading={siteFilesLoading}>
                                            Load more resources (next page {currentPage + 2} of {totalPages}, total {totalElements})
                                        </Button>
                                )}
                                <Typography.Text
                                        type={selectedSiteFileIds.length === 0 ? "warning" : "secondary"}
                                >
                                    {selectedSiteFileIds.length} resource{selectedSiteFileIds.length === 1 ? "" : "s"} selected
                                </Typography.Text>
                            </Space>
                        </Form.Item>
                        <Form.Item name="site_files_id" hidden>
                            <Input type="hidden"/>
                        </Form.Item>

                        <Form.Item key="gallery-acl-list" label="Access control">
                            <AclEdit acls={acls} parentForm={galleryForm}/>
                        </Form.Item>
                        <Space size={12} style={{width: "100%", justifyContent: "center"}}>
                            <Button type="primary" htmlType="submit" disabled={loading}>
                                {sendButtonText}
                            </Button>
                            <Button type="default" htmlType="reset" disabled={loading} onClick={() => {
                                if (gallery) {
                                    galleryForm.setFieldsValue(gallery);
                                    applySelectedSiteFiles(gallery.site_files);
                                }
                            }}>
                                Reset
                            </Button>
                        </Space>
                    </Form>}
                </Spin>
            </div>
    );
}