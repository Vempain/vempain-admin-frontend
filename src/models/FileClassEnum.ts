export const FileClassEnum = {
    ARCHIVE:     'ARCHIVE',
    AUDIO:       'AUDIO',
    BINARY:      'BINARY',
    DATA:        'DATA',
    DOCUMENT:    'DOCUMENT',
    EXECUTABLE:  'EXECUTABLE',
    FONT:        'FONT',
    ICON:        'ICON',
    IMAGE:       'IMAGE',
    INTERACTIVE: 'INTERACTIVE',
    THUMB:       'THUMB',
    UNKNOWN:     'UNKNOWN',
    VECTOR:      'VECTOR',
    VIDEO:       'VIDEO',
} as const;

export type FileClassEnum = typeof FileClassEnum[keyof typeof FileClassEnum];