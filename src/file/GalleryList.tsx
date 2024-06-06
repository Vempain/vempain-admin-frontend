import React, { useEffect, useState } from "react";
import { useSession } from "../session";
import { GalleryVO } from "../models/Responses/Files";
import { fileSystemAPI, galleryAPI } from "../services/Files";
import { ColumnsType } from "antd/lib/table";
import { Button, Space, Spin, Table, TablePaginationConfig } from "antd";
import { aclTool, getPaginationConfig } from "../tools";
import { ActionResult, PrivilegeEnum, QueryDetailEnum, SubmitResult } from "../models";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";
import { SubmitResultHandler } from "../main";

export function GalleryList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [galleryList, setGalleryList] = useState<GalleryVO[]>([]);
    const {userSession} = useSession();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const columns: ColumnsType<GalleryVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Name",
            dataIndex: "short_name",
            key: "short_name",
            sorter: (a, b) => a.short_name.localeCompare(b.short_name)
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: (a, b) => a.description.localeCompare(b.description)
        },
        {
            title: "File count",
            dataIndex: "common_files",
            key: "fileCount",
            sorter: (a, b) => a.common_files.length - b.common_files.length,
            render: (_, record: GalleryVO) => {
                return (<div key={record.id + "-file-count"}>{record.common_files.length}</div>);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: any, record: GalleryVO) => (
                    <Space key={record.id + "-button-space"}>
                        <Button type="primary"
                                key={record.id + "-edit-button"}
                                href={`/galleries/${record.id}/edit`}
                        >Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"}
                                        danger
                                        key={record.id + "-delete-button"}
                                        href={`/galleries/${record.id}/delete`}
                                >Delete</Button>}
                        {aclTool.hasPrivilege(PrivilegeEnum.CREATE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"}
                                        style={{background: "green"}}
                                        key={record.id + "-publish-button"}
                                        href={`/galleries/${record.id}/publish`}
                                >Publish</Button>}
                        {aclTool.hasPrivilege(PrivilegeEnum.MODIFY, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"}
                                        style={{background: "fuchsia"}}
                                        key={record.id + "-refresh-button"}
                                        href={`/galleries/${record.id}/refresh`}
                                >Refresh files</Button>}
                    </Space>
            ),
        }
    ];

    useEffect(() => {
        setLoading(true);
        galleryAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then((response) => {
                    setGalleryList(response);
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

        galleryAPI.publishAll()
                .then(() => {
                    galleryAPI.findAll()
                            .then((response) => {
                                setGalleryList(response);
                            })
                            .catch((error) => {
                                console.error("Error fetching gallery list:", error);
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                });

        setLoading(false);
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

        setLoading(false);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/galleries"} failTo={"/galleries"}/>);
    }

    return (
            <div className={"darkBody"} key={"galleryListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"galleryListSpinner"}>
                    <Space direction={"vertical"} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Gallery List <Link to={"/galleries/0/edit"}><PlusCircleFilled/></Link></h1>
                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "left", margin: 0}}>
                            <Button type={"primary"} onClick={publishAll}>Publish all galleries</Button>
                            <Button type={"primary"} onClick={refreshhAll} style={{background: "fuchsia"}}>Refresh all gallery files</Button>
                        </Space>
                        {galleryList.length > 0 && <Table
                                dataSource={galleryList}
                                columns={columns}
                                pagination={pagination}
                                key={"galleryListTable"}/>}
                    </Space>
                </Spin>
            </div>
    );
}