function formatFileSize(sizeInBytes: number | null | undefined, unit?: 'B' | 'KB' | 'MB' | 'GB' | 'TB'): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;

    if (sizeInBytes == null) {
        return "0 B"
    }

    // Calculate the appropriate unit based on the file size
    while (sizeInBytes >= 1024 && index < units.length - 1) {
        sizeInBytes /= 1024;
        index++;
    }

    // If unit is provided, adjust the size accordingly
    if (unit) {
        const unitIndex = units.indexOf(unit);
        if (unitIndex !== -1) {
            sizeInBytes *= Math.pow(1024, index - unitIndex);
            index = unitIndex;
        }
    }

    const fileSize = sizeInBytes.toFixed(3);
    return `${fileSize} ${units[index]}`;
}

export {formatFileSize};