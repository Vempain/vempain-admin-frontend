import {type Key, useCallback, useEffect, useState} from "react";
import {Button, Input, message, Space, Spin, Switch, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType, SorterResult, SortOrder} from "antd/es/table/interface";
import {type GalleryVO} from "../models";
import type {GalleryPublishRequest} from "../models/Requests/Files";
import {fileSystemAPI, galleryAPI} from "../services";
import {Link} from "react-router-dom";
import {CloudUploadOutlined, DeleteOutlined, EditOutlined, PlusCircleFilled, ReloadOutlined} from "@ant-design/icons";
import {SubmitResultHandler} from "../main";
import {PublishSchedule} from "../content";
import {aclTool, ActionResult, PrivilegeEnum, type SubmitResult, useSession} from "@vempain/vempain-auth-frontend";
import dayjs from "dayjs";

interface GalleryListItem {
    id: number;
    name: string;
    description: string;
    fileCount: number;
    createPrivilege: boolean,
    modifyPrivilege: boolean,
    deletePrivilege: boolean,
}

export function GalleryList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [galleryList, setGalleryList] = useState<GalleryListItem[]>([]);
    const {userSession} = useSession();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(25);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [sortField, setSortField] = useState<string>("id");
    const [sortOrder, setSortOrder] = useState<SortOrder>("ascend");
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedGalleryIds, setSelectedGalleryIds] = useState<number[]>([]);

    const columns: ColumnsType<GalleryListItem> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true,
            sortOrder: sortField === "id" ? sortOrder : undefined
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: true,
            sortOrder: sortField === "short_name" ? sortOrder : undefined
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: true,
            sortOrder: sortField === "description" ? sortOrder : undefined
        },
        {
            title: "File count",
            dataIndex: "fileCount",
            key: "fileCount",
            render: (_, record: GalleryListItem) => {
                return (<div key={`${record.id}-fileCount`}>{record.fileCount}</div>);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: any, record: GalleryListItem) => (
                    <Space key={`${record.id}-buttonSpace`}>
                        <Button
                                type="primary"
                                key={`${record.id}-editButton`}
                                href={`/galleries/${record.id}/edit`}
                        >
                            <EditOutlined/>
                        </Button>
                        {record.deletePrivilege && (
                                <Button
                                        type="primary"
                                        danger
                                        key={`${record.id}-deleteButton`}
                                        href={`/galleries/${record.id}/delete`}
                                >
                                    <DeleteOutlined/>
                                </Button>
                        )}
                        {record.createPrivilege && (
                                <Button
                                        type="primary"
                                        style={{background: "green"}}
                                        key={`${record.id}-publishButton`}
                                        href={`/galleries/${record.id}/publish`}
                                >
                                    <CloudUploadOutlined/>
                                </Button>
                        )}
                        {record.modifyPrivilege && (
                                <Button
                                        type="primary"
                                        style={{background: "fuchsia"}}
                                        key={`${record.id}-refreshButton`}
                                        href={`/galleries/${record.id}/refresh`}
                                >
                                    <ReloadOutlined/>
                                </Button>
                        )}
                    </Space>
            ),
        }
    ];

    const toBackendSortField = (field?: string): string => {
        if (field === "name") {
            return "short_name";
        }
        if (field === "description") {
            return "description";
        }
        return "id";
    };

    const rowSelection = {
        selectedRowKeys: selectedGalleryIds,
        onChange: (selectedRowKeys: Key[]) => setSelectedGalleryIds(selectedRowKeys as number[]),
        preserveSelectedRowKeys: true,
    };

    function convertResponseToGalleryListItems(response: GalleryVO[]) {
        const tmpGalleryList: GalleryListItem[] = response.map((gallery) => {
                    return {
                        id: gallery.id,
                        name: gallery.short_name,
                        description: gallery.description,
                        fileCount: gallery.site_files.length,
                        createPrivilege: aclTool.hasPrivilege(PrivilegeEnum.CREATE, userSession?.id, userSession?.units, gallery.acls),
                        modifyPrivilege: aclTool.hasPrivilege(PrivilegeEnum.MODIFY, userSession?.id, userSession?.units, gallery.acls),
                        deletePrivilege: aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, gallery.acls),
                    };
                }
        );
        setGalleryList(tmpGalleryList);
    }

    const fetchGalleries = useCallback(() => {
        if (!userSession) {
            return;
        }
        setLoading(true);
        galleryAPI.searchGalleries({
            page: currentPage - 1,
            size: pageSize,
            sort: sortField,
            direction: sortOrder === "descend" ? "desc" : "asc",
            search: searchTerm || undefined,
            case_sensitive: caseSensitive,
        })
                .then((response) => {
                    convertResponseToGalleryListItems(response.items);
                    setTotalItems(response.total_items);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [caseSensitive, currentPage, pageSize, searchTerm, sortField, sortOrder, userSession]);

    useEffect(() => {
        fetchGalleries();
    }, [fetchGalleries]);

    function handleTableChange(
            tablePagination: TablePaginationConfig,
            _filters: Record<string, any>,
            sorter: SorterResult<GalleryListItem> | SorterResult<GalleryListItem>[]
    ) {
        setCurrentPage(tablePagination.current ?? 1);
        setPageSize(tablePagination.pageSize ?? 25);
        if (!Array.isArray(sorter) && sorter.field) {
            setSortField(toBackendSortField(sorter.field as string));
            setSortOrder(sorter.order ?? "ascend");
        } else {
            setSortField("id");
            setSortOrder("ascend");
        }
    }

    const onSearch = (value: string) => {
        setSearchInput(value);
        setSearchTerm(value || undefined);
        setCurrentPage(1);
    };

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + totalItems + " galleries?");

        if (!publishAll) {
            return;
        }

        setLoading(true);

        let publishParams: Record<string, any> | undefined = undefined;

        if (schedulePublish && publishDate !== null) {
            publishParams = {publish_date: publishDate.format("YYYY-MM-DDTHH:mm:ssZ")};
        }

        galleryAPI.publishAll(publishParams)
                .then(() => {
                    fetchGalleries();
                })
                .catch((_error) => {
                    console.error("Error publishing all galleries");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function publishSelected(): void {
        if (selectedGalleryIds.length === 0) {
            return;
        }
        setLoading(true);
        const request: GalleryPublishRequest = {gallery_ids: selectedGalleryIds};
        galleryAPI.publishSelectedGalleries(request)
                .then(() => {
                    message.success("Selected galleries publishing triggered");
                    setSelectedGalleryIds([]);
                    fetchGalleries();
                })
                .catch((error) => {
                    console.error("Error publishing selected galleries:", error);
                    message.error("Failed to publish selected galleries");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function refreshhAll(): void {
        const refreshAll = window.confirm("Are you sure you want to refresh all " + galleryList.length + " galleries?");

        if (!refreshAll) {
            return;
        }

        setLoading(true);

        fileSystemAPI.refreshAllGalleryFiles()
                .then((response) => {
                    if (response.result === ActionResult.OK) {
                        setSubmitResults({status: ActionResult.OK, message: "Gallery files refreshed successfully"});
                    } else {
                        const responseDetails = response.details.map((detail) => detail.result_description).join(", ");
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to refresh the gallery files, details: " + responseDetails});
                    }
                })
                .catch((error) => {
                    console.error("Error publishing gallery:", error);
                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to publish the gallery, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/galleries"} failTo={"/galleries"} key={"GalleryListSubmitResultHandler"}/>);
    }

    return (
            <div className={"DarkDiv"} key={"galleryListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"galleryListSpinner"}>
                    <Space vertical={true} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Gallery List <Link to={"/galleries/0/edit"} key={"galleryAddLink"}><PlusCircleFilled/></Link></h1>
                        <Space vertical={false}
                               size={12}
                               style={{width: "100%", justifyContent: "left", margin: 0}}
                               key={"pageListSpaceMainButtonSpace"}
                        >
                            <Button type={"primary"}
                                    onClick={publishAll}
                                    key={"publishAllButton"}
                            >Publish all galleries</Button>
                            <Button type={"primary"}
                                    disabled={selectedGalleryIds.length === 0}
                                    onClick={publishSelected}
                                    key={"publishSelectedButton"}
                            >
                                Publish selected galleries ({selectedGalleryIds.length})
                            </Button>
                            <Button type={"primary"}
                                    onClick={refreshhAll}
                                    style={{background: "fuchsia"}}
                                    key={"refreshAllButton"}
                            >Refresh all gallery files</Button>
                        </Space>
                        <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>
                        <Space wrap key={"galleryListFilters"} align={"center"}>
                            <Input.Search
                                    placeholder={"Search galleries"}
                                    allowClear
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    onSearch={onSearch}
                                    style={{width: 320}}
                            />
                            <Space align={"center"}>
                                Case sensitive
                                <Switch
                                        size={"small"}
                                        checked={caseSensitive}
                                        onChange={(checked) => {
                                            setCaseSensitive(checked);
                                            setCurrentPage(1);
                                        }}
                                />
                            </Space>
                        </Space>
                        <Table
                                dataSource={galleryList}
                                columns={columns}
                                loading={loading}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: totalItems,
                                    showSizeChanger: true,
                                }}
                                onChange={handleTableChange}
                                rowKey={"id"}
                                rowSelection={rowSelection}
                                key={"galleryListTable"}
                        />
                    </Space>
                </Spin>
            </div>
    );
}