import {useMemo, useState} from "react";
import {Button, Space, Spin, Switch} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {CloudUploadOutlined, DeleteOutlined, EditOutlined, PlusCircleFilled} from "@ant-design/icons";
import type {PageResponse} from "../models";
import {pageAPI} from "../services";
import dayjs from "dayjs";
import {PublishSchedule} from "./PublishSchedule";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {useTaskProgress} from "@vempain/vempain-common-frontend";

export function PageList() {
    const [spinMessage, setSpinMessage] = useState("Loading page list...");
    const [publishing, setPublishing] = useState(false);
    const [schedulePublish, setSchedulePublish] = useState(false);
    const [publishDate, setPublishDate] = useState<dayjs.Dayjs | null>(null);
    const {trackTask} = useTaskProgress();
    const paged = usePagedTable<PageResponse>(request => pageAPI.findPageable(request), {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 25
    });

    const columns: ColumnsType<PageResponse> = useMemo(() => [
        {title: "ID", dataIndex: "id", key: "id", sorter: true},
        {title: "Parent ID", dataIndex: "parent_id", key: "parent_id", sorter: true},
        {title: "Form ID", dataIndex: "form_id", key: "form_id", sorter: true},
        {title: "Path", dataIndex: "page_path", key: "page_path", sorter: true, searchable: true},
        {title: "Secure", dataIndex: "secure", key: "secure", sorter: true},
        {title: "Index List", dataIndex: "index_list", key: "index_list", sorter: true},
        {title: "Title", dataIndex: "title", key: "title", sorter: true, searchable: true},
        {title: "Locked", dataIndex: "locked", key: "locked", sorter: true},
        {title: "Creator", dataIndex: "creator", key: "creator", sorter: true},
        {title: "Created", dataIndex: "created", key: "created", sorter: true, render: (_, record) => dayjs(record.created).format("YYYY.MM.DD HH:mm")},
        {title: "Modifier", dataIndex: "modifier", key: "modifier", sorter: true},
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_, record) => record.modified === null ? "-" : dayjs(record.modified).format("YYYY.MM.DD HH:mm")
        },
        {
            title: "Published",
            dataIndex: "published",
            key: "published",
            sorter: true,
            render: (_, record) => record.published === null ? "-" : dayjs(record.published).format("YYYY.MM.DD HH:mm")
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: PageResponse) => (
                    <Space>
                        <Button type="primary" href={`/pages/${record.id}/edit`}><EditOutlined/></Button>
                        <Button type="primary" danger href={`/pages/${record.id}/delete`}><DeleteOutlined/></Button>
                        <Button type="primary" style={{background: "green"}} href={`/pages/${record.id}/publish`}><CloudUploadOutlined/></Button>
                    </Space>
            )
        }
    ], []);

    function publishAll(): void {
        if (!window.confirm(`Are you sure you want to publish all ${paged.dataSource.length} pages?`)) {
            return;
        }

        setSpinMessage("Publishing all pages...");
        setPublishing(true);
        const publishParams = schedulePublish && publishDate !== null
                ? {publish_date: publishDate.format("YYYY-MM-DDTHH:mm:ssZ")}
                : undefined;

        pageAPI.publishAll(publishParams)
                .then((response) => {
                    if (response.task) {
                        // Publishing runs in the background; reload the list once the task has finished
                        trackTask(response.task, {onFinished: () => paged.reload()});
                    } else {
                        paged.reload();
                    }
                })
                .catch(() => console.error("Error publishing all pages"))
                .finally(() => setPublishing(false));
    }

    return (
            <div className={"DarkDiv"} key={"pageListDiv"}>
                {paged.contextHolder}
                <Spin description={spinMessage} spinning={paged.loading || publishing} key={"pageListSpinner"}>
                    <Space vertical={true} size={"large"} key={"pageListSpace"}>
                        <h1 key={"pageListHeader"}>Page List <Link to={"/pages/0/edit"}><PlusCircleFilled/></Link>
                            <Switch checked={paged.caseSensitive} onChange={paged.setCaseSensitive}
                                    checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                        </h1>
                        <Button type="primary" onClick={publishAll}>Publish all pages</Button>
                        <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>
                        <VempainTable
                                dataSource={paged.dataSource}
                                columns={columns}
                                dataMode={"server"}
                                paged={paged}
                                loading={paged.loading || publishing}
                                rowKey={(_record, index) => `row_${index}`}
                                key={"pageListTable"}/>
                    </Space>
                </Spin>
            </div>
    );
}
