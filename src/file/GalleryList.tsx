import {useEffect, useState} from "react";
import {type GalleryVO, QueryDetailEnum} from "../models";
import {fileSystemAPI, galleryAPI} from "../services";
import type {ColumnsType} from "antd/lib/table";
import {Button, Space, Spin, Table, type TablePaginationConfig} from "antd";
import {getPaginationConfig} from "../tools";
import {Link} from "react-router-dom";
import {PlusCircleFilled} from "@ant-design/icons";
import {SubmitResultHandler} from "../main";
import {PublishSchedule} from "../content";
import dayjs from "dayjs";
import {aclTool, ActionResult, PrivilegeEnum, type SubmitResult, useSession} from "@vempain/vempain-auth-frontend";

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
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<dayjs.Dayjs | null>(null);

    const columns: ColumnsType<GalleryListItem> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: (a, b) => a.description.localeCompare(b.description)
        },
        {
            title: "File count",
            dataIndex: "fileCount",
            key: "fileCount",
            sorter: (a, b) => a.fileCount - b.fileCount,
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
                            Edit
                        </Button>
                        {record.deletePrivilege && (
                                <Button
                                        type="primary"
                                        danger
                                        key={`${record.id}-deleteButton`}
                                        href={`/galleries/${record.id}/delete`}
                                >
                                    Delete
                                </Button>
                        )}
                        {record.createPrivilege && (
                                <Button
                                        type="primary"
                                        style={{background: "green"}}
                                        key={`${record.id}-publishButton`}
                                        href={`/galleries/${record.id}/publish`}
                                >
                                    Publish
                                </Button>
                        )}
                        {record.modifyPrivilege && (
                                <Button
                                        type="primary"
                                        style={{background: "fuchsia"}}
                                        key={`${record.id}-refreshButton`}
                                        href={`/galleries/${record.id}/refresh`}
                                >
                                    Refresh files
                                </Button>
                        )}
                    </Space>
            ),
        }
    ];

    function convertResponseToGalleryListItems(response: GalleryVO[]) {
        let tmpGalleryList: GalleryListItem[] = [];

        for (let gallery of response) {
            tmpGalleryList.push({
                id: gallery.id,
                name: gallery.short_name,
                description: gallery.description,
                fileCount: gallery.site_files.length,
                createPrivilege: aclTool.hasPrivilege(PrivilegeEnum.CREATE, userSession?.id, userSession?.units, gallery.acls),
                modifyPrivilege: aclTool.hasPrivilege(PrivilegeEnum.MODIFY, userSession?.id, userSession?.units, gallery.acls),
                deletePrivilege: aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, gallery.acls),
            });
            console.log("Gallery acl:", gallery.acls);
        }

        console.log("Gallery list:", tmpGalleryList);
        setGalleryList(tmpGalleryList);
    }

    useEffect(() => {
        setLoading(true);
        galleryAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then((response) => {
                    convertResponseToGalleryListItems(response);
                    setPagination(getPaginationConfig(response.length));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + galleryList.length + " galleries?");

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
                    galleryAPI.findAll({details: QueryDetailEnum.MINIMAL})
                            .then((response) => {
                                convertResponseToGalleryListItems(response);
                            })
                            .catch((error) => {
                                console.error("Error fetching gallery list:", error);
                            })
                            .finally(() => {
                                setLoading(false);
                            })
                })
                .catch((_error) => {
                    console.error("Error publishing all galleries");
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
                    <Space direction={"vertical"} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Gallery List <Link to={"/galleries/0/edit"} key={"galleryAddLink"}><PlusCircleFilled/></Link></h1>
                        <Space direction={"horizontal"}
                               size={12}
                               style={{width: "100%", justifyContent: "left", margin: 0}}
                               key={"pageListSpaceMainButtonSpace"}
                        >
                            <Button type={"primary"}
                                    onClick={publishAll}
                                    key={"publishAllButton"}
                            >Publish all galleries</Button>
                            <Button type={"primary"}
                                    onClick={refreshhAll}
                                    style={{background: "fuchsia"}}
                                    key={"refreshAllButton"}
                            >Refresh all gallery files</Button>
                        </Space>
                        <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>

                        {galleryList.length > 0 && <Table
                                dataSource={galleryList}
                                columns={columns}
                                pagination={pagination}
                                key={"galleryListTable"}
                                rowKey={"galleryListTableRow"}
                        />}
                    </Space>
                </Spin>
            </div>
    );
}