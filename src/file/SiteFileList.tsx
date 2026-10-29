import {Button, message, Popconfirm, Space, Tag} from "antd";
import {CloudUploadOutlined, DeleteOutlined} from "@ant-design/icons";
import {GenericFileList} from "./GenericFileList";
import {siteFileAPI, userAPI} from "../services";
import type {FileTypeEnum, SiteFileResponse} from "../models";
import {formatDateTimeWithMs, formatFileSize} from "../tools";
import {type Key, useMemo, useState} from "react";
import {UserName, type VempainColumnsType} from "@vempain/vempain-auth-frontend";
import {useTaskProgress} from "@vempain/vempain-common-frontend";

interface Props {
    fileType: FileTypeEnum;
    title?: string;
}

export function SiteFileList({fileType, title}: Props) {
    const requestParams = useMemo(() => ({file_type: fileType}), [fileType]);
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const {trackTask} = useTaskProgress();

    /**
     * Publishes the given files as one background task; the list is reloaded when the task has finished so that the "Published" column is current.
     */
    function publishFiles(fileIds: number[], reload: () => void): void {
        if (fileIds.length === 0) {
            return;
        }

        setActionLoading(true);
        siteFileAPI.publishSelectedFiles({file_ids: fileIds})
                .then((response) => {
                    if (response.task) {
                        trackTask(response.task, {onFinished: reload});
                    } else {
                        reload();
                    }
                    message.success(fileIds.length === 1 ? "File publishing started" : "Publishing of the selected files started");
                    setSelectedFileIds((selected) => selected.filter((id) => !fileIds.includes(id)));
                })
                .catch((error) => {
                    console.error("Error publishing files:", error);
                    message.error(fileIds.length === 1 ? "Failed to publish the file" : "Failed to publish the selected files");
                })
                .finally(() => {
                    setActionLoading(false);
                });
    }

    function deleteFile(file: SiteFileResponse, reload: () => void): void {
        setActionLoading(true);
        siteFileAPI.delete(file.id)
                .then(() => {
                    message.success("File " + file.file_name + " deleted");
                    setSelectedFileIds((selected) => selected.filter((id) => id !== file.id));
                    reload();
                })
                .catch((error) => {
                    console.error("Error deleting file:", error);
                    message.error("Failed to delete the file " + file.file_name);
                })
                .finally(() => {
                    setActionLoading(false);
                });
    }

    const rowSelection = {
        selectedRowKeys: selectedFileIds,
        onChange: (selectedRowKeys: Key[]) => setSelectedFileIds(selectedRowKeys as number[]),
        preserveSelectedRowKeys: true,
    };

    const columnsFor = (reload: () => void): VempainColumnsType<SiteFileResponse> => [
        // The file name identifies the row and stays with the actions however narrow the table gets; the other columns are
        // dropped least important first (see the priorities)
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            priority: 9,
            minWidth: 140,
            render: (_, record) => <UserName userAPI={userAPI} id={record.creator}/>,
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            priority: 8,
            minWidth: 200,
            render: (_, record) => <>{formatDateTimeWithMs(record.created)}</>,
        },
        {
            title: "File name",
            dataIndex: "file_name",
            key: "file_name",
            sorter: true,
            mobile: true,
            minWidth: 200,
        },
        {
            title: "Path",
            dataIndex: "file_path",
            key: "file_path",
            ellipsis: true,
            priority: 5,
            minWidth: 200,
        },
        {
            title: "Class",
            dataIndex: "file_class",
            key: "file_class",
            priority: 6,
            width: 120,
            filters: [
                {text: "ARCHIVE", value: "ARCHIVE"},
                {text: "AUDIO", value: "AUDIO"},
                {text: "DOCUMENT", value: "DOCUMENT"},
                {text: "IMAGE", value: "IMAGE"},
                {text: "VIDEO", value: "VIDEO"},
                {text: "VECTOR", value: "VECTOR"},
                {text: "ICON", value: "ICON"},
                {text: "FONT", value: "FONT"},
                {text: "EXECUTABLE", value: "EXECUTABLE"},
                {text: "INTERACTIVE", value: "INTERACTIVE"},
                {text: "DATA", value: "DATA"},
                {text: "BINARY", value: "BINARY"},
                {text: "THUMB", value: "THUMB"},
                {text: "UNKNOWN", value: "UNKNOWN"},
            ],
            render: (_, record) =>
                    record.file_type ? <Tag>{record.file_type}</Tag> : null,
        },
        {
            title: "MIME type",
            dataIndex: "mime_type",
            key: "mime_type",
            priority: 7,
            minWidth: 140,
        },
        {
            title: "Size",
            dataIndex: "size",
            key: "size",
            sorter: true,
            priority: 4,
            width: 110,
            render: (_, record) => <>{formatFileSize(record.size)}</>,
        },
        {
            title: "SHA256",
            dataIndex: "sha256sum",
            key: "sha256sum",
            ellipsis: true,
            priority: 10,
            minWidth: 160,
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            priority: 3,
            minWidth: 200,
            render: (_, record) => {
                if (record.modified) {
                    return (<>{formatDateTimeWithMs(record.modified)}</>);
                }

                return <></>;
            },
        },
        {
            title: "Published",
            dataIndex: "published",
            key: "published",
            sorter: true,
            priority: 2,
            minWidth: 200,
            render: (_, record) => {
                if (record.published) {
                    return (<>{formatDateTimeWithMs(record.published)}</>);
                }

                return <>Not published</>;
            },
        },
        {
            title: "Action",
            key: "action",
            width: 120,
            render: (_, record) => (
                    <Space key={`${record.id}-buttonSpace`}>
                        <Button
                                type="primary"
                                style={{background: "green"}}
                                key={`${record.id}-publishButton`}
                                aria-label={`Publish ${record.file_name}`}
                                title="Publish to the website"
                                onClick={() => publishFiles([record.id], reload)}
                        >
                            <CloudUploadOutlined/>
                        </Button>
                        <Popconfirm
                                key={`${record.id}-deleteConfirm`}
                                title="Delete file"
                                description={`Delete ${record.file_name} from the admin and from the website?`}
                                okText="Delete"
                                okButtonProps={{danger: true}}
                                onConfirm={() => deleteFile(record, reload)}
                        >
                            <Button
                                    type="primary"
                                    danger
                                    key={`${record.id}-deleteButton`}
                                    aria-label={`Delete ${record.file_name}`}
                                    title="Delete the file"
                            >
                                <DeleteOutlined/>
                            </Button>
                        </Popconfirm>
                    </Space>
            ),
        },
    ];

    return (
            <div className="DarkDiv">
                {title ? <h1>{title}</h1> : null}
                <GenericFileList<SiteFileResponse>
                        valueObjectColumns={columnsFor}
                        api={siteFileAPI}
                        requestParams={requestParams}
                        rowSelection={rowSelection}
                        actionLoading={actionLoading}
                        toolbar={(reload) => (
                                <Space vertical={false} size={12} style={{width: "100%", justifyContent: "left", margin: 0}}>
                                    <Button type={"primary"}
                                            disabled={selectedFileIds.length === 0}
                                            onClick={() => publishFiles(selectedFileIds, reload)}
                                            key={"publishSelectedButton"}
                                    >
                                        Publish selected files ({selectedFileIds.length})
                                    </Button>
                                </Space>
                        )}
                />
            </div>
    );
}
