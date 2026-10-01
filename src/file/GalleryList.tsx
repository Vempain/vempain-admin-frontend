import {type Key, useState} from "react";
import {Button, message, Space, Spin} from "antd";
import {type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import {aclTool, ActionResult, PrivilegeEnum, type SubmitResult, usePagedTable, useSession, VempainTable} from "@vempain/vempain-auth-frontend";
import type {GalleryPublishRequest} from "../models/Requests/Files";
import {fileSystemAPI, galleryAPI} from "../services";
import {Link} from "react-router-dom";
import {CloudUploadOutlined, DeleteOutlined, EditOutlined, PlusCircleFilled, ReloadOutlined} from "@ant-design/icons";
import {SubmitResultHandler} from "../main";
import {PublishSchedule} from "../content";
import dayjs, {type Dayjs} from "dayjs";
import {formatDateTime} from "../tools";

interface GalleryListItem {
    id: number;
    name: string;
    description: string;
    fileCount: number;
    createPrivilege: boolean,
    modifyPrivilege: boolean,
    deletePrivilege: boolean,
    created: Dayjs,
    modified: Dayjs | null
}

export function GalleryList() {
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const {userSession} = useSession();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedGalleryIds, setSelectedGalleryIds] = useState<number[]>([]);

    const paged = usePagedTable<GalleryListItem>(async (request) => {
        const response = await galleryAPI.findPageableList({
            ...request,
            sort_by: request.sort_by === "name" ? "short_name" : request.sort_by,
            filter_column: request.filter_column === "name" ? "short_name" : request.filter_column
        });
        return {
            ...response, content: response.content.map((gallery) => ({
                id: gallery.id,
                name: gallery.short_name,
                created: gallery.created,
                modified: gallery.modified,
                description: gallery.description,
                fileCount: gallery.file_count,
                createPrivilege: aclTool.hasPrivilege(PrivilegeEnum.CREATE, userSession?.id, userSession?.units, gallery.acls),
                modifyPrivilege: aclTool.hasPrivilege(PrivilegeEnum.MODIFY, userSession?.id, userSession?.units, gallery.acls),
                deletePrivilege: aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, gallery.acls)
            }))
        };
    }, {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 25,
        deps: [userSession?.id, userSession?.units?.map((unit) => unit.id).join(",")]
    });

    const columns: VempainColumnsType<GalleryListItem> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: true,
            searchable: true
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: true,
            searchable: true
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
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: true,
            render: (_text, record) => {
                return formatDateTime(record.created);
            }
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_text, record) => {
                if (record.modified === null) {
                    return "-";
                }

                return formatDateTime(record.modified);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: GalleryListItem) => (
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

    const rowSelection = {
        selectedRowKeys: selectedGalleryIds,
        onChange: (selectedRowKeys: Key[]) => setSelectedGalleryIds(selectedRowKeys as number[]),
        preserveSelectedRowKeys: true,
    };

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + (paged.pagination.total ?? 0) + " galleries?");

        if (!publishAll) {
            return;
        }

        setActionLoading(true);

        let publishParams: Record<string, string> | undefined = undefined;

        if (schedulePublish && publishDate !== null) {
            publishParams = {publish_date: publishDate.format("YYYY-MM-DDTHH:mm:ssZ")};
        }

        galleryAPI.publishAll(publishParams)
                .then(() => {
                    paged.reload();
                })
                .catch((_error) => {
                    console.error("Error publishing all galleries");
                })
                .finally(() => {
                    setActionLoading(false);
                });
    }

    function publishSelected(): void {
        if (selectedGalleryIds.length === 0) {
            return;
        }
        setActionLoading(true);
        const request: GalleryPublishRequest = {gallery_ids: selectedGalleryIds};
        galleryAPI.publishSelectedGalleries(request)
                .then(() => {
                    message.success("Selected galleries publishing triggered");
                    setSelectedGalleryIds([]);
                    paged.reload();
                })
                .catch((error) => {
                    console.error("Error publishing selected galleries:", error);
                    message.error("Failed to publish selected galleries");
                })
                .finally(() => {
                    setActionLoading(false);
                });
    }

    function refreshhAll(): void {
        const refreshAll = window.confirm("Are you sure you want to refresh all " + paged.dataSource.length + " galleries?");

        if (!refreshAll) {
            return;
        }

        setActionLoading(true);

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
                    setActionLoading(false);
                });
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/galleries"} failTo={"/galleries"} key={"GalleryListSubmitResultHandler"}/>);
    }

    return (
            <div className={"DarkDiv"} key={"galleryListDiv"}>
                <Spin description={"Loading"} spinning={paged.loading || actionLoading} key={"galleryListSpinner"}>
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
                        {paged.contextHolder}
                        <VempainTable
                                dataSource={paged.dataSource}
                                columns={columns}
                                dataMode={"server"}
                                paged={paged}
                                loading={paged.loading || actionLoading}
                                rowKey={"id"}
                                rowSelection={rowSelection}
                                key={"galleryListTable"}
                        />
                    </Space>
                </Spin>
            </div>
    );
}