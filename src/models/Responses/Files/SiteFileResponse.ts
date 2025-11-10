import type {LocationResponse} from "../LocationResponse.ts";
import type {FileTypeEnum} from "../../FileTypeEnum.ts";

export interface SiteFileResponse {
    id: number;
    file_name: string;
    file_path: string;
    file_type: FileTypeEnum;
    mime_type: string;
    size: number;
    sha256sum: string;
    creator: number;
    created: string;
    modifier: number | null;
    modified: string | null;

    comment: string | null;
    metadata: string | null;

    original_date_time: string | null;

    rights_holder: string | null;
    rights_terms: string | null;
    rights_url: string | null;

    creator_name: string | null;
    creator_email: string | null;
    creator_country: string | null;
    creator_url: string | null;

    location: LocationResponse | null;
}