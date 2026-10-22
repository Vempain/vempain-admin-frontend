import type {WebSiteConfigurationTypeEnum} from "../WebSiteConfigurationTypeEnum.ts";
import type {WebSiteConfigurationRequest} from "../Requests";

export interface WebSiteConfigurationResponse extends WebSiteConfigurationRequest {
    config_key: string;
    config_type: WebSiteConfigurationTypeEnum;
    config_default: string;
    /** Nick of the admin user who created the row, null for the seeded configuration rows */
    creator?: string | null;
    created?: string | null;
    /** Nick of the admin user who last updated the value, null when never updated */
    modifier?: string | null;
    modified?: string | null;
}