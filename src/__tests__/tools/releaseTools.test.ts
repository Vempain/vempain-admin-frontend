import dayjs from "dayjs";
import {isModifiedAfterPublish} from "../../tools/releaseTools";

describe("isModifiedAfterPublish", () => {
    const released = "2026-01-05T08:00:00Z";
    const later = "2026-01-06T08:00:00Z";
    const earlier = "2026-01-04T08:00:00Z";

    it("is true only when the resource was released and then modified", () => {
        expect(isModifiedAfterPublish(released, later)).toBe(true);
        expect(isModifiedAfterPublish(dayjs(released), dayjs(later))).toBe(true);
        expect(isModifiedAfterPublish(released, earlier)).toBe(false);
        expect(isModifiedAfterPublish(released, released)).toBe(false);
    });

    it("is false for a resource never released, never modified or with unusable timestamps", () => {
        expect(isModifiedAfterPublish(null, later)).toBe(false);
        expect(isModifiedAfterPublish(released, null)).toBe(false);
        expect(isModifiedAfterPublish(undefined, undefined)).toBe(false);
        expect(isModifiedAfterPublish("", later)).toBe(false);
        expect(isModifiedAfterPublish("not a date", later)).toBe(false);
    });
});
