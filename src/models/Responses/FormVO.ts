import type {ComponentVO} from "./ComponentVO";
import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface FormVO extends AbstractResponse {
    id: number;
    name: string;
    layout_id: number;
    components: ComponentVO[];
}
