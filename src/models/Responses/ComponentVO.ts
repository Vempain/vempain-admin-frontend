import type {AbstractPermissionVO} from "../AbstractPermissionVO";

export interface ComponentVO extends AbstractPermissionVO {
    id: number;
    comp_name: string;
    comp_data: string;
}
