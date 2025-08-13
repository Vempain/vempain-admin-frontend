import type {AclVO} from "@vempain/vempain-auth-frontend";

export interface BaseRequest {
    id: number;
    acls: AclVO[];

}