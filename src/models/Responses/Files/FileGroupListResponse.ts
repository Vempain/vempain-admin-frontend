import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface FileGroupListResponse extends AbstractResponse {
    short_name: string;
    description: string;
    file_count: number;
}
