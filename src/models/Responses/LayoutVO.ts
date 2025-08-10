import type {AbstractPermissionVO} from "../AbstractPermissionVO";

export interface LayoutVO extends AbstractPermissionVO {
    id: number;
    layout_name: string;
    structure: string;
}