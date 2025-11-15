export const QueryDetailEnum = {
    GALLERY: 'GALLERY',
    FILE: 'FILE',
    PAGE: 'PAGE'
} as const;

export type WebSiteResourceTypeEnum = typeof QueryDetailEnum[keyof typeof QueryDetailEnum];
