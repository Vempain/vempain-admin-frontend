import type {ComponentVO} from "./ComponentVO";
import type {AbstractPermissionVO} from "../AbstractPermissionVO";

export interface FormVO extends AbstractPermissionVO {
    id: number;
    name: string;
    layout_id: number;
    components: ComponentVO[];
}
