import type {Dayjs} from "dayjs";
import {PublishStatusEnum} from "../PublishStatusEnum";
import {ContentTypeEnum} from "../ContentTypeEnum";

export interface PublishScheduleRequest {
    id: number;
    publish_time: Dayjs;
    publish_status: PublishStatusEnum;
    publish_message: string;
    publish_type: ContentTypeEnum;
    publish_id: number;
}