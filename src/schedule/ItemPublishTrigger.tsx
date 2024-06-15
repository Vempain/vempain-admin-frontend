import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {validateParamId} from "../tools";
import {scheduleAPI} from "../services";
import {Button, DatePicker, Space, Spin, Table} from "antd";
import {PublishScheduleResponse} from "../models/Responses";
import {ColumnsType} from "antd/lib/table";
import {PublishScheduleRequest} from "../models/Requests/PublishScheduleRequest";
import dayjs, {Dayjs} from "dayjs";
import {ActionResult, SubmitResult} from "../models";
import {SubmitResultHandler} from "../main";

// Define the loading messages
const spinMessages: Record<string, string> = {
    loadingItemSchedule: "Loading item schedule...",
    triggerItemSchedule: "Triggering item schedule..."
};

function ItemPublishTrigger() {
    const {paramId} = useParams();
    const [itemId, setItemId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [spinTip, setSpinTip] = useState<string>(spinMessages.loadingItemSchedule);
    const [publishSchedule, setPublishSchedule] = useState<PublishScheduleResponse | null>(null);
    const [publishDate, setPublishDate] = useState<Dayjs>(dayjs());
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    const columns: ColumnsType<PublishScheduleResponse> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            defaultSortOrder: "descend",
        },
        {
            title: "Publish time",
            dataIndex: "publish_time",
            key: "publish_time",
            defaultSortOrder: "descend",
        },
        {
            title: "Status",
            dataIndex: "publish_status",
            key: "publish_status",
        },
        {
            title: "Message",
            dataIndex: "publish_message",
            key: "publish_message",
        },
        {
            title: "Type",
            dataIndex: "publish_type",
            key: "publish_type",
        },
        {
            title: "Publish ID",
            dataIndex: "publish_id",
            key: "publish_id",
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
        },
        {
            title: "Updated",
            dataIndex: "updated_at",
            key: "updated_at",
        }
    ];


    useEffect(() => {
        setSpinTip(spinMessages.loadingItemSchedule);
        setLoading(true);
        let tmpPageId: number = validateParamId(paramId);

        if (tmpPageId > 0) {
            setItemId(tmpPageId);

            scheduleAPI.getPublishSchedule(tmpPageId)
                    .then((response) => {
                        setPublishSchedule(response);
                        setPublishDate(dayjs(response.publish_time));
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }, []);

    function triggerPublish() {
        if (publishSchedule !== null) {
            setLoading(true);
            setSpinTip(spinMessages.triggerItemSchedule);
            const publishTriggerRequest: PublishScheduleRequest = {
                id: publishSchedule.id,
                publish_time: publishDate.toDate(),
                publish_status: publishSchedule.publish_status,
                publish_message: publishSchedule.publish_message,
                publish_type: publishSchedule.publish_type,
                publish_id: itemId
            };

            scheduleAPI.triggerPublishSchedule(publishTriggerRequest)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Schedule triggered successfully"})
                    })
                    .catch((error) => {
                        console.error(error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to trigger schedule"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/schedule/publishing"} failTo={"/schedule/publishing"}/>);
    }

    return (
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading} tip={spinTip}>
                    <Space direction={"vertical"} size={"large"}>
                        <h2>Publish Schedule Trigger</h2>
                        {publishSchedule !== null && <>
                            <Table key={"scheduleTable"}
                                   columns={columns}
                                   dataSource={[publishSchedule]}
                                   pagination={false}/>
                            <h4>Delay trigger (seconds)</h4>
                            <DatePicker key={"publishDatePicker"}
                                        value={publishDate}
                                        showTime={{format: 'HH:mm', defaultValue: dayjs()}}
                                        minuteStep={15 as 15}
                                        format={'YYYY-DD-MM HH:mm'}
                                        onChange={(value, _dateString) => {
                                            setPublishDate(value);
                                        }}
                            />
                            <Button type={"primary"} onClick={triggerPublish}>Trigger</Button>
                        </>}
                    </Space>
                </Spin>
            </div>
    );
}

export {ItemPublishTrigger};