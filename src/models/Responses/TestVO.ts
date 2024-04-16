import {AclVO} from "./AclVO";

export interface TestVO {
    id: number;
    name: string;
    active: boolean;
    acls: AclVO[];
}
