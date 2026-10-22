import type {Dayjs} from "dayjs";
import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface FileGroupListResponse extends AbstractResponse {
    short_name: string;
    description: string;
    file_count: number;
    /** When the gallery was last released to the website, null when never */
    published: Dayjs | null;
}
