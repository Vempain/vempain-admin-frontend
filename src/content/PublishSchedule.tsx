import dayjs, {Dayjs} from "dayjs";
import {DatePicker, Divider, Space, Switch} from "antd";
import {useState} from "react";

interface PublishScheduleProps {
    setSchedulePublish: (checked: boolean) => void;
    setPublishDate: (value: Dayjs | null) => void;
}


export function PublishSchedule(publishScheduleProps: PublishScheduleProps) {
    const [schedulePublish, setLocalSchedulePublish] = useState(false);

    function handleSwitchChange(checked: boolean): void {
        setLocalSchedulePublish(checked);
        publishScheduleProps.setSchedulePublish(checked);
    }

    function handleDatePickerChange(value: Dayjs | null, _dateString: string | string[]): void {
        publishScheduleProps.setPublishDate(value);
    }

    return (
            <Space direction={"vertical"} size={"large"}>

                <Divider orientation="left">Publish schedule</Divider>
                <Switch
                        key="scheduleSwitch"
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                        onChange={handleSwitchChange}
                />
                {schedulePublish && (
                        <DatePicker
                                key="publishDatePicker"
                                showTime={{format: 'HH:mm', defaultValue: dayjs()}}
                                minuteStep={15 as 15}
                                format="YYYY-DD-MM HH:mm"
                                onChange={handleDatePickerChange}
                        />
                )}
            </Space>
    );
}
