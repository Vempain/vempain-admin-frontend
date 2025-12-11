import type {WebSiteConfigurationTypeEnum} from "../WebSiteConfigurationTypeEnum.ts";

export type WebSiteConfigurationResponse = {
    id: string;
    config_key: string;
    config_type: WebSiteConfigurationTypeEnum;
    config_default: string;
    config_value: string;
}