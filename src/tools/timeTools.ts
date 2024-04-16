function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

function padTo3Digits(num: number) {
    return num.toString().padStart(3, '0');
}

function formatDateTime(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate())
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes())
        ].join(':')
    );
}

function formatDateTimeWithMs(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        formatDateTime(date) + ':' +
        [
            padTo2Digits(date.getSeconds()),
            padTo3Digits(date.getMilliseconds())
        ].join(':')
    );
}

export {padTo2Digits, padTo3Digits, formatDateTime, formatDateTimeWithMs};