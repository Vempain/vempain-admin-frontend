import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {WebSiteDataPublish} from "../website/WebSiteDataPublish";
import type {DataSummaryResponse} from "../models";

const getAllDataSets = jest.fn();
const publishDataSet = jest.fn();

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
    ...overrides
});

describe("WebSiteDataPublish", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows music availability and GPS time series list", async () => {
        getAllDataSets.mockResolvedValue([
            buildDataSummary({id: 10, identifier: "music_collection", description: "Music archive"}),
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
    });

    it("publishes selected data set and reloads list", async () => {
        getAllDataSets.mockResolvedValue([
            buildDataSummary({id: 20, identifier: "music_album_data", description: "Music CD collection"})
        ]);
        publishDataSet.mockResolvedValue({identifier: "music_album_data"});

        render(<WebSiteDataPublish/>);

        await waitFor(() => {
            expect(getAllDataSets).toHaveBeenCalledTimes(1);
        });

        const releaseButton = screen.getByRole("button", {name: "Release to website"});
        await userEvent.click(releaseButton);

        await waitFor(() => {
            expect(publishDataSet).toHaveBeenCalledWith("music_album_data");
            expect(getAllDataSets).toHaveBeenCalledTimes(2);
        });
    });
});

