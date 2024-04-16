import {ComponentVO} from "./ComponentVO";
import {AbstractPermissionVO} from "../AbstractPermissionVO";

export interface FormVO extends AbstractPermissionVO {
    id: number;
    name: string;
    layout_id: number;
    components: ComponentVO[];
}
