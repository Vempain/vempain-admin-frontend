import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {ScheduleTriggerResponse} from "../models/Responses/ScheduleTriggerResponse";
import {scheduleAPI} from "../services";
import {Button, InputNumber, Space, Spin, Table} from "antd";
import {ScheduleTriggerRequest} from "../models/Requests/ScheduleTriggerRequest";
import {ColumnsType} from "antd/lib/table";
import {ActionResult, SubmitResult} from "../models";
import {SubmitResultHandler} from "../main";

function SystemScheduleTrigger() {
    const {paramName} = useParams();
    const [scheduleName, setScheduleName] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [schedule, setSchedule] = useState<ScheduleTriggerResponse | null>(null);
    const [delay, setDelay] = useState<number>(3);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    const columns: ColumnsType<ScheduleTriggerResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            defaultSortOrder: "descend",
        },
        {
            title: "Schedule Name",
            dataIndex: "schedule_name",
            key: "schedule_name",
            defaultSortOrder: "descend",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
        }
    ];

    useEffect(() => {
        setLoading(true);

        if (paramName === undefined || paramName === null || paramName === "") {
            setLoading(false);
            return;
        }

        let tmpScheduleName: string = paramName;
        setScheduleName(paramName);

        scheduleAPI.getSystemSchedule(tmpScheduleName)
                .then((response) => {
                    setSchedule(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function triggerSchedule() {
        if (schedule === null) {
            return;
        }

        setLoading(true);

        const triggerRequest: ScheduleTriggerRequest = {
            schedule_name: schedule.schedule_name,
            delay: delay !== undefined ? delay : 0
        }

        scheduleAPI.triggerSystemSchedule(triggerRequest)
                .then(() => {
                    setSubmitResults({status: ActionResult.OK, message: "System schedule triggered successfully"})
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to trigger system schedule"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/schedule/system"} failTo={"/schedule/system"}/>);
    }

    return (
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading} tip={"Fetching schedule details..."}>
                    <Space direction={"vertical"} size={"large"}>
                        <h2>System Schedule Trigger</h2>
                        {schedule !== null && <>
                            <Table key={"scheduleTable"}
                                   columns={columns}
                                   dataSource={[schedule]}
                                   pagination={false}/>
                            <h4>Delay trigger (seconds)</h4>
                            <InputNumber min={1} max={10_000} defaultValue={3} onChange={(delayValue) => {
                                if (typeof delayValue === "number") {
                                    setDelay(delayValue);
                                }
                            }} changeOnWheel/>
                            <Button type={"primary"} onClick={triggerSchedule}>Trigger</Button>
                        </>}
                    </Space>
                </Spin>
            </div>
    );
}

export {
    SystemScheduleTrigger
};