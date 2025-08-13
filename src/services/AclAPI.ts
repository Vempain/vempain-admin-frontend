import {AbstractAPI, type AclVO} from "@vempain/vempain-auth-frontend";

class AclAPI extends AbstractAPI<AclVO, AclVO> {
    private static convertNullUserUnit(aclList: AclVO[]): AclVO[] {
        for (let i = 0; i < aclList.length; i++) {
            if (aclList[i].unit === null) {
                aclList[i].unit = 0;
            }

            if (aclList[i].user === null) {
                aclList[i].user = 0;
            }
        }

        return aclList;
    }

    public async findAllById(id: number): Promise<AclVO[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<AclVO[]>("/" + id);

        return AclAPI.convertNullUserUnit(response.data);
    }

    public async findAll(): Promise<AclVO[]> {
        let aclList = await super.findAll();
        aclList = AclAPI.convertNullUserUnit(aclList);
        return aclList;
    }
}

export const aclAPI = new AclAPI(import.meta.env.VITE_APP_API_URL, "/content-management/acls");
