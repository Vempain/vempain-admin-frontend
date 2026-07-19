import {Button, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import type {PublishScheduleResponse} from "../models";
import {ContentTypeEnum} from "../models";
import type {ColumnsType} from "antd/lib/table";
import {scheduleAPI} from "../services";
import dayjs from "dayjs";
import {contentTypeEnumToTag, formatDateTime, publishStatusEnumToTag} from "../tools";

function ItemPublishingList() {
    const [loading, setLoading] = useState<boolean>(true);
    const [publishScheduleList, setPublishScheduleList] = useState<PublishScheduleResponse[]>([]);

    const columns: ColumnsType<PublishScheduleResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Publish time",
            dataIndex: "publish_time",
            key: "publish_time",
            defaultSortOrder: "descend",
            sorter: (a, b) => dayjs(a.publish_time).unix() - dayjs(b.publish_time).unix(),
            render: (_: Record<string, unknown>, response: PublishScheduleResponse) => {
                return formatDateTime(response.publish_time);
            }
        },
        {
            title: "Status",
            dataIndex: "publish_status",
            key: "publish_status",
            sorter: (a, b) => a.publish_status.localeCompare(b.publish_status),
            render: (_: Record<string, unknown>, response: PublishScheduleResponse) => {
                return publishStatusEnumToTag(response.publish_status as ContentTypeEnum, response.id);
            }
        },
        {
            title: "Message",
            dataIndex: "publish_message",
            key: "publish_message",
            sorter: (a, b) => a.publish_message.localeCompare(b.publish_message),
        },
        {
            title: "Type",
            dataIndex: "publish_type",
            key: "publish_type",
            sorter: (a, b) => a.publish_type.localeCompare(b.publish_type),
            render: (_: Record<string, unknown>, response: PublishScheduleResponse) => {
                return contentTypeEnumToTag(response.publish_type as ContentTypeEnum, response.id);
            }
        },
        {
            title: "Publish ID",
            dataIndex: "publish_id",
            key: "publish_id",
            sorter: (a, b) => a.publish_id - b.publish_id,
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            render: (_text, record: PublishScheduleResponse) => (
                    <Button type="primary" href={`/schedule/publish/${record.id}/trigger`}>Trigger</Button>
            )
        }
    ];


    useEffect(() => {
        setLoading(true);

        scheduleAPI.getPublishSchedules()
                .then((response) => {
                    setPublishScheduleList(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <div className={"DarkDiv"} key={"layoutListDiv"}>
                <Spin description={"Loading"} spinning={loading} key={"publishScheduleListSpinner"}>
                    <h1 key={"publishScheduleListHeader"}>Publish schedule List</h1>

                    {publishScheduleList.length > 0 && <Table
                            dataSource={publishScheduleList}
                            columns={columns}
                            key={"publishScheduleListTable"}/>}
                    {publishScheduleList.length === 0 && <h2 key={"publishScheduleListEmpty"}>No publish schedules found</h2>}
                </Spin>
            </div>
    );
}

export {ItemPublishingList};