import {formatDateTime, formatDateTimeWithMs, padTo2Digits, padTo3Digits} from '../tools';

describe('padTo2Digits', () => {
    it('pads single digit numbers', () => {
        expect(padTo2Digits(5)).toBe('05');
    });
    it('does not pad two digit numbers', () => {
        expect(padTo2Digits(12)).toBe('12');
    });
});

describe('padTo3Digits', () => {
    it('pads single digit numbers', () => {
        expect(padTo3Digits(7)).toBe('007');
    });
    it('pads two digit numbers', () => {
        expect(padTo3Digits(45)).toBe('045');
    });
    it('does not pad three digit numbers', () => {
        expect(padTo3Digits(123)).toBe('123');
    });
});

describe('formatDateTime', () => {
    it('formats Date object', () => {
        const date = new Date('2023-05-01T14:23:00');
        expect(formatDateTime(date)).toBe('2023-05-01 14:23');
    });
    it('formats ISO string', () => {
        expect(formatDateTime('2023-05-01T14:23:00')).toBe('2023-05-01 14:23');
    });
});

describe('formatDateTimeWithMs', () => {
    it('formats Date object with ms', () => {
        const date = new Date('2023-05-01T14:23:45.123');
        expect(formatDateTimeWithMs(date)).toBe('2023-05-01 14:23:45:123');
    });
    it('formats ISO string with ms', () => {
        expect(formatDateTimeWithMs('2023-05-01T14:23:45.007')).toBe('2023-05-01 14:23:45:007');
    });
});
