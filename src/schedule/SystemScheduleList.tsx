import {useEffect, useState} from "react";
import {ScheduleTriggerResponse} from "../models/Responses/ScheduleTriggerResponse";
import {scheduleAPI} from "../services";
import {ColumnsType} from "antd/lib/table";
import {Button, Spin, Table} from "antd";

function SystemScheduleList() {
    const [loading, setLoading] = useState<boolean>(true);
    const [systemScheduleList, setSystemScheduleList] = useState<ScheduleTriggerResponse[]>([]);

    const columns: ColumnsType<ScheduleTriggerResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "scheduleId",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Schedule Name",
            dataIndex: "schedule_name",
            key: "schedule_name",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.schedule_name.localeCompare(b.schedule_name),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "scheduleStatus",
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            render: (_text: any, record: any) => (
                    <Button type="primary" href={`/schedule/system/${record.schedule_name}/trigger`} key={record.id + "-triggerButton"}>Trigger</Button>
            )
        }
    ];

    useEffect(() => {
        setLoading(true);

        scheduleAPI.getSystemSchedules()
                .then((response) => {
                    setSystemScheduleList(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);
    return (
            <div className={"darkBody"} key={"systemScheduleListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"systemScheduleListSpinner"}>
                    <h1 key={"systemScheduleListHeader"}>System schedule List</h1>

                    {systemScheduleList.length > 0 && <Table
                            dataSource={systemScheduleList}
                            columns={columns}
                            key={"systemScheduleListTable"}
                            rowKey={"systemScheduleListTableRow"}
                    />}
                    {systemScheduleList.length === 0 && <h2 key={"systemScheduleListEmpty"}>No system schedules found</h2>}
                </Spin>
            </div>
    );
}

export {SystemScheduleList};