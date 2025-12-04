import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface LayoutVO extends AbstractResponse {
    id: number;
    layout_name: string;
    structure: string;
}