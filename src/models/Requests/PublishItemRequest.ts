import type {Dayjs} from "dayjs";

export interface PublishItemRequest {
    id: number;
    publish_message: string;
    publish_schedule: boolean;
    publish_date_time: Dayjs | null;
}