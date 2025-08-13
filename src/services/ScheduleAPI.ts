import Axios, {type AxiosInstance} from "axios";
import type {FileImportScheduleResponse, PublishScheduleRequest, PublishScheduleResponse, ScheduleTriggerRequest, ScheduleTriggerResponse} from "../models";
import type {JwtResponse} from "@vempain/vempain-auth-frontend";

class ScheduleAPI {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
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

    public async getSystemSchedules(): Promise<ScheduleTriggerResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<ScheduleTriggerResponse[]>("/system-schedules");
        return response.data;
    }

    public async getSystemSchedule(scheduleName: string): Promise<ScheduleTriggerResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<ScheduleTriggerResponse>("/system-schedules/" + scheduleName);
        return response.data;
    }

    public async triggerSystemSchedule(triggerRequest: ScheduleTriggerRequest): Promise<ScheduleTriggerResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<ScheduleTriggerResponse>("/system-schedules", triggerRequest);
        return response.data;
    }

    public async getPublishSchedules(): Promise<PublishScheduleResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishScheduleResponse[]>("/publishing");
        return response.data;
    }

    public async getPublishSchedule(publishScheduleId: number): Promise<PublishScheduleResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishScheduleResponse>("/publishing/" + publishScheduleId);
        return response.data;
    }

    public async triggerPublishSchedule(publishScheduleRequest: PublishScheduleRequest): Promise<ScheduleTriggerResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<ScheduleTriggerResponse>("/publishing", publishScheduleRequest);
        return response.data;
    }

    public async getFileImportSchedules(): Promise<FileImportScheduleResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<FileImportScheduleResponse[]>("/file-imports");
        return response.data;
    }

    public async getFileImportScheduleByName(scheduleName: string): Promise<FileImportScheduleResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<FileImportScheduleResponse[]>("/file-imports/" + scheduleName);
        return response.data;
    }
}

export const scheduleAPI = new ScheduleAPI("/schedule-management");
