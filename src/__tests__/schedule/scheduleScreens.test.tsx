import {fireEvent, screen, waitFor, within} from "@testing-library/react";
import dayjs from "dayjs";
import {ItemPublishingList} from "../../schedule/ItemPublishingList";
import {ItemPublishTrigger} from "../../schedule/ItemPublishTrigger";
import {SystemScheduleList} from "../../schedule/SystemScheduleList";
import {SystemScheduleTrigger} from "../../schedule/SystemScheduleTrigger";
import {ContentTypeEnum, PublishStatusEnum} from "../../models";
import {publishSchedule, systemSchedule} from "../helpers/testData";
import {renderAt} from "../helpers/renderUtils";

const getPublishSchedules = jest.fn();
const getPublishSchedule = jest.fn();
const triggerPublishSchedule = jest.fn();
const getSystemSchedules = jest.fn();
const getSystemSchedule = jest.fn();
const triggerSystemSchedule = jest.fn();

jest.mock("../../services", () => ({
    scheduleAPI: {
        getPublishSchedules: (...args: unknown[]) => getPublishSchedules(...args),
        getPublishSchedule: (...args: unknown[]) => getPublishSchedule(...args),
        triggerPublishSchedule: (...args: unknown[]) => triggerPublishSchedule(...args),
        getSystemSchedules: (...args: unknown[]) => getSystemSchedules(...args),
        getSystemSchedule: (...args: unknown[]) => getSystemSchedule(...args),
        triggerSystemSchedule: (...args: unknown[]) => triggerSystemSchedule(...args)
    }
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe("ItemPublishingList", () => {
    it("lists the publish schedules with status and type tags, sortable columns and a trigger link", async () => {
        getPublishSchedules.mockResolvedValue([
            publishSchedule(),
            publishSchedule({
                id: 32, publish_status: PublishStatusEnum.PUBLISHED, publish_type: ContentTypeEnum.GALLERY, publish_message: "Album",
                publish_time: dayjs("2026-03-01T09:00:00Z"), publish_id: 12
            })
        ]);
        renderAt(<ItemPublishingList/>, {route: "/schedule/publishing"});

        expect(await screen.findByText("Release notes")).toBeInTheDocument();
        expect(screen.getByText("Not published")).toBeInTheDocument();
        expect(screen.getByText("Published")).toBeInTheDocument();
        expect(screen.getByText("Page")).toBeInTheDocument();
        expect(screen.getByText("Gallery")).toBeInTheDocument();
        expect(screen.getByText(dayjs("2026-02-01T09:00:00Z").format("YYYY-MM-DD HH:mm"))).toBeInTheDocument();
        const row = screen.getByText("Release notes").closest("tr") as HTMLElement;
        expect(within(row).getByText("Trigger").closest("a")).toHaveAttribute("href", "/schedule/publish/31/trigger");

        for (const header of ["ID", "Publish time", "Status", "Message", "Type", "Publish ID"]) {
            fireEvent.click(screen.getByText(header));
        }
        expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
    });

    it("tells when there are no schedules and logs a failed load", async () => {
        getPublishSchedules.mockResolvedValue([]);
        renderAt(<ItemPublishingList/>, {route: "/schedule/publishing"});
        expect(await screen.findByText("No publish schedules found")).toBeInTheDocument();

        getPublishSchedules.mockRejectedValue(new Error("down"));
        renderAt(<ItemPublishingList/>, {route: "/schedule/publishing"});
        await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.any(Error)));
    });
});

describe("ItemPublishTrigger", () => {
    it("loads the schedule and triggers it with the selected publish time", async () => {
        getPublishSchedule.mockResolvedValue(publishSchedule());
        triggerPublishSchedule.mockResolvedValue(systemSchedule());
        renderAt(<ItemPublishTrigger/>, {route: "/schedule/publish/31/trigger", path: "/schedule/publish/:paramId/trigger"});

        expect(await screen.findByText("Release notes")).toBeInTheDocument();
        expect(getPublishSchedule).toHaveBeenCalledWith(31);

        const picker = screen.getByPlaceholderText("Select date") as HTMLInputElement;
        fireEvent.mouseDown(picker);
        fireEvent.change(picker, {target: {value: "2026-15-04 10:30"}});
        fireEvent.keyDown(picker, {key: "Enter", code: "Enter"});
        await waitFor(() => expect(picker.value).toBe("2026-15-04 10:30"));

        fireEvent.click(screen.getByText("Trigger"));
        await waitFor(() => expect(triggerPublishSchedule).toHaveBeenCalledTimes(1));
        const request = triggerPublishSchedule.mock.calls[0][0];
        expect(request).toMatchObject({id: 31, publish_status: PublishStatusEnum.NOT_PUBLISHED, publish_type: ContentTypeEnum.PAGE, publish_id: 31});
        expect(dayjs(request.publish_time).format("YYYY-MM-DD HH:mm")).toBe("2026-04-15 10:30");
        expect(await screen.findByText("Schedule triggered successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/schedule/publishing");
    });

    it("reports a failed trigger and logs a failed load", async () => {
        getPublishSchedule.mockResolvedValue(publishSchedule());
        triggerPublishSchedule.mockRejectedValue(new Error("rejected"));
        renderAt(<ItemPublishTrigger/>, {route: "/schedule/publish/31/trigger", path: "/schedule/publish/:paramId/trigger"});
        fireEvent.click(await screen.findByText("Trigger"));
        expect(await screen.findByText("Failed to trigger schedule")).toBeInTheDocument();

        getPublishSchedule.mockRejectedValue(new Error("down"));
        renderAt(<ItemPublishTrigger/>, {route: "/schedule/publish/31/trigger", path: "/schedule/publish/:paramId/trigger"});
        await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.any(Error)));
    });

    it("does not load anything for an invalid id", () => {
        renderAt(<ItemPublishTrigger/>, {route: "/schedule/publish/abc/trigger", path: "/schedule/publish/:paramId/trigger"});
        expect(getPublishSchedule).not.toHaveBeenCalled();
        expect(screen.getByText("Publish Schedule Trigger")).toBeInTheDocument();
    });
});

describe("SystemScheduleList", () => {
    it("lists the system schedules with sortable columns and trigger links", async () => {
        getSystemSchedules.mockResolvedValue([systemSchedule(), systemSchedule({id: 42, schedule_name: "weekly-report", status: "RUNNING"})]);
        renderAt(<SystemScheduleList/>, {route: "/schedule/system"});

        expect(await screen.findByText("nightly-cleanup")).toBeInTheDocument();
        expect(screen.getByText("weekly-report")).toBeInTheDocument();
        const row = screen.getByText("nightly-cleanup").closest("tr") as HTMLElement;
        expect(within(row).getByText("Trigger").closest("a")).toHaveAttribute("href", "/schedule/system/nightly-cleanup/trigger");
        for (const header of ["ID", "Schedule Name", "Status"]) {
            fireEvent.click(screen.getByText(header));
        }
    });

    it("tells when there are no schedules and logs a failed load", async () => {
        getSystemSchedules.mockResolvedValue([]);
        renderAt(<SystemScheduleList/>, {route: "/schedule/system"});
        expect(await screen.findByText("No system schedules found")).toBeInTheDocument();

        getSystemSchedules.mockRejectedValue(new Error("down"));
        renderAt(<SystemScheduleList/>, {route: "/schedule/system"});
        await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.any(Error)));
    });
});

describe("SystemScheduleTrigger", () => {
    it("loads the schedule and triggers it with the entered delay", async () => {
        getSystemSchedule.mockResolvedValue(systemSchedule());
        triggerSystemSchedule.mockResolvedValue(systemSchedule());
        renderAt(<SystemScheduleTrigger/>, {route: "/schedule/system/nightly-cleanup/trigger", path: "/schedule/system/:paramName/trigger"});

        expect(await screen.findByText("System Schedule Trigger: nightly-cleanup")).toBeInTheDocument();
        expect(getSystemSchedule).toHaveBeenCalledWith("nightly-cleanup");
        expect(screen.getByText("IDLE")).toBeInTheDocument();

        const delay = screen.getByRole("spinbutton");
        fireEvent.change(delay, {target: {value: "7"}});
        fireEvent.blur(delay);
        fireEvent.click(screen.getByText("Trigger"));

        await waitFor(() => expect(triggerSystemSchedule).toHaveBeenCalledWith({schedule_name: "nightly-cleanup", delay: 7}));
        expect(await screen.findByText("System schedule triggered successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/schedule/system");
    });

    it("reports a failed trigger and logs a failed load", async () => {
        getSystemSchedule.mockResolvedValue(systemSchedule());
        triggerSystemSchedule.mockRejectedValue(new Error("rejected"));
        renderAt(<SystemScheduleTrigger/>, {route: "/schedule/system/nightly-cleanup/trigger", path: "/schedule/system/:paramName/trigger"});
        fireEvent.click(await screen.findByText("Trigger"));
        expect(await screen.findByText("Failed to trigger system schedule")).toBeInTheDocument();

        getSystemSchedule.mockRejectedValue(new Error("down"));
        renderAt(<SystemScheduleTrigger/>, {route: "/schedule/system/nightly-cleanup/trigger", path: "/schedule/system/:paramName/trigger"});
        await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.any(Error)));
    });

    it("loads nothing without a schedule name", () => {
        renderAt(<SystemScheduleTrigger/>, {route: "/trigger", path: "/trigger"});
        expect(getSystemSchedule).not.toHaveBeenCalled();
        expect(screen.getByText("System Schedule Trigger:")).toBeInTheDocument();
        expect(screen.queryByText("Trigger")).not.toBeInTheDocument();
    });
});
