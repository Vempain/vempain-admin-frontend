import {Button, message, Space, Tag, Typography} from "antd";
import {useCallback, useMemo, useState} from "react";
import type {DataSummaryResponse} from "../models";
import {dataAPI, userAPI} from "../services";
import {formatDateTime, stickyTableHeader} from "../tools";
import {ReleaseFilterSwitch} from "../main/ReleaseFilterSwitch";
import {useTaskProgress} from "@vempain/vempain-common-frontend";
import {usePagedTable, UserName, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";

/**
 * The data sets of the admin backend (music library, GPS time series, ...) as a server-paged table like the other lists: the backend
 * filters (column search, type, "modified after publish"), sorts and pages (POST /content-management/data/paged), and every row can be
 * released to the website as a background task.
 */
export function WebSiteDataPublish() {
    const [publishingIdentifier, setPublishingIdentifier] = useState<string | null>(null);
    const [modifiedAfterPublish, setModifiedAfterPublish] = useState(false);
    const {trackTask} = useTaskProgress();

    const paged = usePagedTable<DataSummaryResponse>(request => dataAPI.findPageableDataSets({...request, modified_after_publish: modifiedAfterPublish}), {
        defaultSortBy: "identifier",
        defaultDirection: "ASC",
        defaultPageSize: 25,
        deps: [modifiedAfterPublish]
    });

    const handlePublish = useCallback(async (identifier: string) => {
        setPublishingIdentifier(identifier);
        try {
            const accepted = await dataAPI.publishDataSet(identifier);
            // The publishing runs as a background task; the page is reloaded once it has finished
            trackTask(accepted, {onFinished: () => paged.reload()});
            message.success(`Publishing of data set '${identifier}' to the website started`);
        } catch (error) {
            console.error(error);
            message.error(`Failed to publish data set '${identifier}'`);
        } finally {
            setPublishingIdentifier(null);
        }
    }, [paged, trackTask]);

    // Identifier, type and description are searchable (the backend's filter_column); the timestamps and the audit columns only sort
    const columns: VempainColumnsType<DataSummaryResponse> = useMemo(() => [
        {title: "Identifier", dataIndex: "identifier", key: "identifier", sorter: true, defaultSortOrder: "ascend"},
        {title: "Type", dataIndex: "type", key: "type", sorter: true, render: (_, record) => <Tag>{record.type}</Tag>},
        {title: "Description", dataIndex: "description", key: "description", sorter: true, render: (_, record) => record.description ?? "-"},
        {title: "Generated", dataIndex: "generated", key: "generated", sorter: true, searchable: false, render: (_, record) => formatDateTime(record.generated)},
        {title: "ACL", dataIndex: "acl_id", key: "acl_id", sorter: true, searchable: false, width: 80},
        {
            title: "Creator", dataIndex: "creator", key: "creator", sorter: true, searchable: false,
            render: (_, record) => <UserName userAPI={userAPI} id={record.creator}/>
        },
        {title: "Created", dataIndex: "created", key: "created", sorter: true, searchable: false, render: (_, record) => formatDateTime(record.created)},
        {
            title: "Modifier", dataIndex: "modifier", key: "modifier", sorter: true, searchable: false,
            render: (_, record) => record.modifier === null ? "-" : <UserName userAPI={userAPI} id={record.modifier}/>
        },
        {
            title: "Modified", dataIndex: "modified", key: "modified", sorter: true, searchable: false,
            render: (_, record) => record.modified === null ? "-" : formatDateTime(record.modified)
        },
        {
            title: "Released", dataIndex: "published", key: "published", sorter: true, searchable: false,
            render: (_, record) => record.published ? formatDateTime(record.published) : "Not released"
        },
        {
            title: "Actions",
            key: "actions",
            width: 180,
            render: (_, record) => (
                    <Button
                            type="primary"
                            onClick={() => void handlePublish(record.identifier)}
                            loading={publishingIdentifier === record.identifier}
                    >
                        Release to website
                    </Button>
            )
        }
    ], [handlePublish, publishingIdentifier]);

    return (
            <div>
                <Typography.Title level={3}>Website data publishing</Typography.Title>
                <Space orientation="vertical" size={6} style={{marginBottom: 16}}>
                    <Typography.Text type="secondary">
                        Data sets created by the file backend (music library, GPS time series) and their release state on the website
                    </Typography.Text>
                    <ReleaseFilterSwitch checked={modifiedAfterPublish} onChange={setModifiedAfterPublish}/>
                </Space>
                {paged.contextHolder}
                <VempainTable<DataSummaryResponse>
                        sticky={stickyTableHeader}
                        rowKey={(record) => record.identifier}
                        columns={columns}
                        dataMode={"server"}
                        paged={paged}
                        loading={paged.loading}
                        size="small"
                />
            </div>
    );
}
