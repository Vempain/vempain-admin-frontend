import type {FormVO} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class FormAPI extends AbstractAPI<FormVO, FormVO> {
    public async findFormsByComponentId(componentId: number): Promise<FormVO[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<FormVO[]>("/used-by-components/" + componentId);
        return response.data;
    }

    public async findFormsByLayoutId(layoutId: number) {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<FormVO[]>("/used-by-layout/" + layoutId);
        return response.data;
    }
}

export const formAPI = new FormAPI(import.meta.env.VITE_APP_API_URL, "/content-management/forms");
