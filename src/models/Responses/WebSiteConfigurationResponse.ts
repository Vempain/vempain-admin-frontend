import type {WebSiteConfigurationTypeEnum} from "../WebSiteConfigurationTypeEnum.ts";
import type {WebSiteConfigurationRequest} from "../Requests";

export interface WebSiteConfigurationResponse extends WebSiteConfigurationRequest {
    config_key: string;
    config_type: WebSiteConfigurationTypeEnum;
    config_default: string;
}