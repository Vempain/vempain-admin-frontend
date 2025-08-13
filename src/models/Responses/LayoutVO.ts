import type {AbstractPermissionVO} from "@vempain/vempain-auth-frontend";

export interface LayoutVO extends AbstractPermissionVO {
    id: number;
    layout_name: string;
    structure: string;
}