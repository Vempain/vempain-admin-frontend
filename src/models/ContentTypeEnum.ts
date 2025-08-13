// ContentTypeEnum.ts
export const ContentTypeEnum = {
    PAGE: 'PAGE',
    COMPONENT: 'COMPONENT',
    LAYOUT: 'LAYOUT',
    FORM: 'FORM',
    GALLERY: 'GALLERY'
} as const;

export type ContentTypeEnum = typeof ContentTypeEnum[keyof typeof ContentTypeEnum];