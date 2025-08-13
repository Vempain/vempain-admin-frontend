// PublishStatusEnum.ts
export const PublishStatusEnum = {
    NOT_PUBLISHED: 'NOT_PUBLISHED',
    PROCESSING: 'PROCESSING',
    PUBLISHED: 'PUBLISHED',
    CANCELLED: 'CANCELLED'
} as const;

export type PublishStatusEnum = typeof PublishStatusEnum[keyof typeof PublishStatusEnum];