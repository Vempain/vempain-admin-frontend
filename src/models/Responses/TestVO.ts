import type {AclVO} from "@vempain/vempain-auth-frontend";

export interface TestVO {
    id: number;
    name: string;
    active: boolean;
    acls: AclVO[];
}
