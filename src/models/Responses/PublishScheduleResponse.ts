import {PublishStatusEnum} from "../PublishStatusEnum";
import {ContentTypeEnum} from "../ContentTypeEnum";

export interface PublishScheduleResponse {
    id: number;
    publish_time: Date;
    publish_status: PublishStatusEnum;
    publish_message: string;
    publish_type: ContentTypeEnum;
    publish_id: number;
    created_at: Date;
    updated_at: Date;
}