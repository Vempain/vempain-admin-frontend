import {AclVO} from "./Responses/AclVO";

export interface AbstractPermissionVO {
    acls: AclVO[];
    created: Date;
    creator: number;
    locked: boolean;
    modified: Date;
    modifier: number;
}