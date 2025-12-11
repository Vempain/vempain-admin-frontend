export const WebSiteConfigurationTypeEnum = {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    List: 'LIST'
} as const;

export type WebSiteConfigurationTypeEnum = typeof WebSiteConfigurationTypeEnum[keyof typeof WebSiteConfigurationTypeEnum];