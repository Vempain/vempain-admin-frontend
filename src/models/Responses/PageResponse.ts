import type {Dayjs} from "dayjs";
import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface PageResponse extends AbstractResponse {
    id: number;
    parent_id: number;
    form_id: number;
    page_path: string;
    secure: boolean;
    index_list: boolean;
    title: string;
    header: string;
    body: string;
    /** Custom CSS of the page, published with it and applied by the website while the page is shown; null for none */
    page_style: string | null;
    published: Dayjs | null;
    /** Tags (subject names) of the page, published to the website with it */
    tags: string[];
}
