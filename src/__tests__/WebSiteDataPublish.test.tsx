import {render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {WebSiteDataPublish} from "../website/WebSiteDataPublish";
import type {DataSummaryResponse} from "../models";

const getAllDataSets = jest.fn();
const publishDataSet = jest.fn();
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../services", () => ({
    dataAPI: {
        getAllDataSets: (...args: unknown[]) => getAllDataSets(...args),
        publishDataSet: (...args: unknown[]) => publishDataSet(...args)
    }
}));

const buildDataSummary = (overrides: Partial<DataSummaryResponse>): DataSummaryResponse => ({
    id: 1,
    identifier: "default",
    type: "tabulated",
    description: "default",
    column_definitions: "[]",
    create_sql: "CREATE TABLE data_placeholder (value TEXT)",
    fetch_all_sql: "fetch_all_placeholder",
    fetch_subset_sql: "fetch_subset_placeholder",
    generated: "2026-01-01T10:00:00Z",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    published: null,
    ...overrides
});

describe("WebSiteDataPublish", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows music availability and GPS time series list", async () => {
        getAllDataSets.mockResolvedValue([
            buildDataSummary({id: 10, identifier: "music_collection", description: "Music archive", published: "2026-01-05T08:00:00Z"}),
            buildDataSummary({id: 11, identifier: "gps_series", type: "time_series", description: "GPS tracks"}),
            buildDataSummary({id: 12, identifier: "weather_series", type: "time_series", description: "Weather data"})
        ]);

        render(<WebSiteDataPublish/>);

        await waitFor(() => {
            expect(getAllDataSets).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText("Music data available for publishing: Yes")).not.toBeNull();
        expect(screen.getByText("music_collection")).not.toBeNull();
        expect(screen.getByText("gps_series")).not.toBeNull();
        expect(screen.queryByText("weather_series")).toBeNull();
        // The music set was released once, the GPS series never
        expect(within(screen.getByText("music_collection").closest("tr") as HTMLElement).getByText(/2026-01-05 \d\d:00/)).not.toBeNull();
        expect(within(screen.getByText("gps_series").closest("tr") as HTMLElement).getByText("Not released")).not.toBeNull();
    });

    it("keeps only the data sets updated after their last release when the filter is on", async () => {
        getAllDataSets.mockResolvedValue([
            // released, then updated: outdated on the site
            buildDataSummary({
                id: 10, identifier: "music_outdated", description: "Music archive", published: "2026-01-05T08:00:00Z",
                updated_at: "2026-01-06T08:00:00Z"
            }),
            // updated before the release: up to date
            buildDataSummary({
                id: 11, identifier: "music_current", description: "Music archive", published: "2026-01-05T08:00:00Z",
                updated_at: "2026-01-04T08:00:00Z"
            }),
            // never released
            buildDataSummary({id: 12, identifier: "gps_series", type: "time_series", description: "GPS tracks", published: null}),
            // released, then regenerated
            buildDataSummary({
                id: 13, identifier: "gps_outdated", type: "time_series", description: "GPS tracks", published: "2026-01-05T08:00:00Z",
                updated_at: "2026-01-07T08:00:00Z"
            })
        ]);

        render(<WebSiteDataPublish/>);
        expect(await screen.findByText("music_outdated")).not.toBeNull();
        expect(screen.getByText("music_current")).not.toBeNull();
        expect(screen.getByText("gps_series")).not.toBeNull();
        expect(screen.getByText("gps_outdated")).not.toBeNull();

        await userEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));

        expect(screen.getByText("music_outdated")).not.toBeNull();
        expect(screen.queryByText("music_current")).toBeNull();
        expect(screen.queryByText("gps_series")).toBeNull();
        expect(screen.getByText("gps_outdated")).not.toBeNull();
        expect(screen.getByText("Total matching music data sets: 1")).not.toBeNull();

        await userEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        expect(screen.getByText("music_current")).not.toBeNull();
        expect(screen.getByText("gps_series")).not.toBeNull();
    });

    it("starts the publishing task of the selected data set and reloads the list once it has finished", async () => {
        getAllDataSets.mockResolvedValue([
            buildDataSummary({id: 20, identifier: "music_album_data", description: "Music CD collection"})
        ]);
        const accepted = {task_id: "task-1", type: "PUBLISH_DATA_SET", title: "Publish data set music_album_data", status: "QUEUED", total_steps: 1};
        publishDataSet.mockResolvedValue(accepted);

        render(<WebSiteDataPublish/>);

        await waitFor(() => {
            expect(getAllDataSets).toHaveBeenCalledTimes(1);
        });

        const releaseButton = screen.getByRole("button", {name: "Release to website"});
        await userEvent.click(releaseButton);

        await waitFor(() => {
            expect(publishDataSet).toHaveBeenCalledWith("music_album_data");
            expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        });
        expect(getAllDataSets).toHaveBeenCalledTimes(1);

        // The list is reloaded by the onFinished callback of the tracked task
        const options = trackTask.mock.calls[0][1] as { onFinished: () => void };
        options.onFinished();
        await waitFor(() => {
            expect(getAllDataSets).toHaveBeenCalledTimes(2);
        });
    });
});


describe("WebSiteDataPublish failures", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("reports a failed data set load", async () => {
        const {message} = jest.requireActual("antd");
        const error = jest.spyOn(message, "error").mockImplementation(() => ({}));
        getAllDataSets.mockRejectedValue(new Error("down"));
        render(<WebSiteDataPublish/>);
        await waitFor(() => expect(error).toHaveBeenCalledWith("Failed to load data sets"));
    });

    it("reports a failed publish request", async () => {
        const {message} = jest.requireActual("antd");
        const error = jest.spyOn(message, "error").mockImplementation(() => ({}));
        getAllDataSets.mockResolvedValue([buildDataSummary({id: 20, identifier: "music_album_data", description: "Music CD collection"})]);
        publishDataSet.mockRejectedValue(new Error("rejected"));
        render(<WebSiteDataPublish/>);
        await userEvent.click(await screen.findByRole("button", {name: "Release to website"}));
        await waitFor(() => expect(error).toHaveBeenCalledWith("Failed to publish data set 'music_album_data'"));
        expect(trackTask).not.toHaveBeenCalled();
    });
});
