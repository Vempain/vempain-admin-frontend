export const WebSiteResourceTypeEnum = {
    GALLERY: 'GALLERY',
    SITE_FILE: 'SITE_FILE',
    PAGE: 'PAGE'
} as const;

export type WebSiteResourceTypeEnum = typeof WebSiteResourceTypeEnum[keyof typeof WebSiteResourceTypeEnum];
