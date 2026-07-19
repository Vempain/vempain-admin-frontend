import dayjs, {type Dayjs} from "dayjs";

function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

function padTo3Digits(num: number) {
    return num.toString().padStart(3, '0');
}

function formatDateTime(date: Dayjs | string) {
    const d = dayjs.isDayjs(date) ? date : dayjs(date);

    return d.format('YYYY-MM-DD HH:mm');
}

function formatDate(date: Dayjs | string) {
    const d = dayjs.isDayjs(date) ? date : dayjs(date);

    return d.format('YYYY-MM-DD');
}

function formatDateTimeWithMs(date: Dayjs | string) {
    const d = dayjs.isDayjs(date) ? date : dayjs(date);

    return d.format('YYYY-MM-DD HH:mm:ss') + ':' + padTo3Digits(d.millisecond());
}

export {padTo2Digits, padTo3Digits, formatDateTime, formatDateTimeWithMs, formatDate};