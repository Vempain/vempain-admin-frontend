import Axios, {AxiosInstance} from "axios";
import {ActionVO, JwtResponse, PageableResponse} from "../models/Responses";
import {PublishItemRequest} from "../models/Requests/PublishItemRequest";

export abstract class AbstractAPI<REQUEST, RESPONSE> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
    }

    public async findAll(params?: Record<string, any>): Promise<RESPONSE[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<RESPONSE[]>("", {params: params});
        return response.data;
    }

    /**
     * This should be used instead of findAll() when you want to use pagination.
     * @param params
     */
    public async findPageable(params?: Record<string, any>): Promise<PageableResponse<RESPONSE>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PageableResponse<RESPONSE>>("", {params: params});
        return response.data;
    }

    public async findById(id: number, parameters: string | null): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        let url = "/" + id;

        if (parameters !== null) {
            url = parameters ? url + "?" + parameters : url;
        }
        const response = await this.axiosInstance.get<RESPONSE>(url);
        return response.data;
    }

    public async create(payload: REQUEST): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<RESPONSE>("", payload);
        return response.data;
    }

    public async update(payload: REQUEST): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<RESPONSE>("", payload);
        return response.data;
    }

    public async delete(id: number): Promise<boolean> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.delete<RESPONSE>("/" + id);
        return response.status === 200;
    }

    public async publish(request: PublishItemRequest): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.patch<ActionVO>("/publish", request);
        return response.data;
    }

    public async publishAll(): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<ActionVO>("/publish");
        return response.data;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

        if (session && session.token) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.token;
        }
    }
}
