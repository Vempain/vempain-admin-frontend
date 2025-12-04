import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface ComponentVO extends AbstractResponse {
    id: number;
    comp_name: string;
    comp_data: string;
}
