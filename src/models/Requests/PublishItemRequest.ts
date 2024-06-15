export interface PublishItemRequest {
    id: number;
    publish_message: string;
    publish_schedule: boolean;
    publish_date_time: Date | null;
}