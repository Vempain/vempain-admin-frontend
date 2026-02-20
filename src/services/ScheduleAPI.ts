import type {FileImportScheduleResponse, PublishScheduleRequest, PublishScheduleResponse, ScheduleTriggerRequest, ScheduleTriggerResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ScheduleAPI extends AbstractAPI<ScheduleTriggerRequest, ScheduleTriggerResponse> {

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

export const scheduleAPI = new ScheduleAPI(import.meta.env.VITE_APP_API_URL, "/schedule-management");
