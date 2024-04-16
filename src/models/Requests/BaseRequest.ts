import {AclVO} from "../Responses";

export interface BaseRequest {
    id: number;
    acls: AclVO[];

}