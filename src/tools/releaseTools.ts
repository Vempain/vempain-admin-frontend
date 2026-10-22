import dayjs, {type Dayjs} from "dayjs";

type Timestamp = Dayjs | string | null | undefined;

function toDayjs(value: Timestamp): Dayjs | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
    return parsed.isValid() ? parsed : null;
}

/**
 * The one rule behind the "modified after publish" filter of every list of resources released to the website, mirroring
 * the backend's ReleaseState: true when the resource was both released and modified, and the release is older than the
 * modification, i.e. the website shows an outdated copy. A resource never released, or never modified since its
 * creation, is not outdated.
 */
function isModifiedAfterPublish(published: Timestamp, modified: Timestamp): boolean {
    const releasedAt = toDayjs(published);
    const modifiedAt = toDayjs(modified);

    if (releasedAt === null || modifiedAt === null) {
        return false;
    }

    return releasedAt.isBefore(modifiedAt);
}

export {isModifiedAfterPublish};
