import type {AbstractPermissionVO} from "@vempain/vempain-auth-frontend";

export interface ComponentVO extends AbstractPermissionVO {
    id: number;
    comp_name: string;
    comp_data: string;
}
