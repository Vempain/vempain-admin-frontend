import { Button, Spin, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { PublishScheduleResponse } from "../models/Responses";
import { ColumnsType } from "antd/lib/table";
import { scheduleAPI } from "../services";
import { ContentTypeEnum } from "../models/ContentTypeEnum";

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
            sorter: (a, b) => new Date(a.publish_time).getTime() - new Date(b.publish_time).getTime(),
        },
        {
            title: "Status",
            dataIndex: "publish_status",
            key: "publish_status",
            sorter: (a, b) => a.publish_status.localeCompare(b.publish_status),
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
            render: (_: any, response: PublishScheduleResponse) => {
                let color = "";
                let typeLabel: string = "";

                switch (response.publish_type) {
                    case ContentTypeEnum.GALLERY:
                        color = "blue";
                        typeLabel = "Gallery";
                        break;
                    case ContentTypeEnum.COMPONENT:
                        color = "green";
                        typeLabel = "Component";
                        break;
                    case ContentTypeEnum.LAYOUT:
                        color = "purple";
                        typeLabel = "Layout";
                        break;
                    case ContentTypeEnum.FORM:
                        color = "orange";
                        typeLabel = "Form";
                        break;
                    case ContentTypeEnum.PAGE:
                        color = "red";
                        typeLabel = "Page";
                        break;
                    default:
                        color = "gray";
                        typeLabel = "Unknown";
                        break;
                }

                return (
                        <Tag color={color} key={typeLabel + response.id}>
                            {typeLabel}
                        </Tag>
                );
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
            render: (_text: any, record: any) => (
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
            <div className={"darkBody"} key={"layoutListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"publishScheduleListSpinner"}>
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

export { ItemPublishingList };