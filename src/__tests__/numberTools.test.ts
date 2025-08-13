import {formatFileSize} from '../tools';

describe('formatFileSize', () => {
    it('returns "0 B" for null or undefined', () => {
        expect(formatFileSize(null)).toBe('0 B');
        expect(formatFileSize(undefined)).toBe('0 B');
    });

    it('formats bytes correctly', () => {
        expect(formatFileSize(512)).toBe('512.000 B');
        expect(formatFileSize(1024)).toBe('1.000 KB');
        expect(formatFileSize(1048576)).toBe('1.000 MB');
        expect(formatFileSize(1073741824)).toBe('1.000 GB');
    });

    it('formats with specified unit', () => {
        expect(formatFileSize(1048576, 'KB')).toBe('1024.000 KB');
        expect(formatFileSize(1048576, 'MB')).toBe('1.000 MB');
        expect(formatFileSize(1048576, 'GB')).toBe('0.001 GB');
    });

    it('handles TB unit', () => {
        expect(formatFileSize(1099511627776)).toBe('1.000 TB');
    });
});

