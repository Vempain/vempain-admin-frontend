// QueryDetailEnum.ts
export const QueryDetailEnum = {
    MINIMAL: 'MINIMAL',
    UNPOPULATED: 'UNPOPULATED',
    FULL: 'FULL'
} as const;

export type QueryDetailEnum = typeof QueryDetailEnum[keyof typeof QueryDetailEnum];