export interface PublishRequest {
    id: number;
    publish_schedule: boolean;
    publish_datetime: Date | null;
}