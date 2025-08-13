import type {AbstractPermissionVO} from "@vempain/vempain-auth-frontend";

export interface PageVO extends AbstractPermissionVO {
    id: number;
    parent_id: number;
    form_id: number;
    path: string;
    secure: boolean;
    index_list: boolean;
    title: string;
    header: string;
    body: string;
    published: Date | null;
}
