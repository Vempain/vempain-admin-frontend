import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {WebSiteDataPublish} from "../website/WebSiteDataPublish";
import type {DataSummaryResponse} from "../models";
import {pagedResponse} from "./helpers/testData";

const findPageableDataSets = jest.fn();
const publishDataSet = jest.fn();
const trackTask = jest.fn();

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask: (...args: unknown[]) => trackTask(...args)})
}));

jest.mock("../services", () => ({
    dataAPI: {
        findPageableDataSets: (...args: unknown[]) => findPageableDataSets(...args),
        publishDataSet: (...args: unknown[]) => publishDataSet(...args)
    },
    userAPI: {findById: jest.fn()}
}));

// The creator and modifier columns resolve the user names through the shared UserName of the auth library
jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    UserName: ({id}: { id: number }) => <span>user {id}</span>
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
    acl_id: 40,
    acls: [],
    locked: false,
    creator: 7,
    created: "2026-01-02T10:00:00Z",
    modifier: null,
    modified: null,
    published: null,
    ...overrides
});

function row(identifier: string): HTMLElement {
    return screen.getByText(identifier).closest("tr") as HTMLElement;
}

describe("WebSiteDataPublish", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        findPageableDataSets.mockResolvedValue(pagedResponse([
            buildDataSummary({id: 10, identifier: "music_collection", description: "Music archive", acl_id: 41, published: "2026-01-05T08:00:00Z"}),
            buildDataSummary({
                id: 11, identifier: "gps_series", type: "time_series", description: "GPS tracks", acl_id: 42, modifier: 9,
                modified: "2026-01-06T08:00:00Z"
            })
        ]));
    });

    it("lists the page the backend answers with its release state and audit columns", async () => {
        render(<WebSiteDataPublish/>);

        expect(await screen.findByText("music_collection")).not.toBeNull();
        // the first page is asked sorted by identifier, with the release filter off
        expect(findPageableDataSets).toHaveBeenCalledWith(expect.objectContaining({
            page: 0, size: 25, sort_by: "identifier", direction: "ASC", modified_after_publish: false
        }));
        expect(screen.getByText("gps_series")).not.toBeNull();
        const headers = screen.getAllByRole("columnheader").map(header => header.textContent);
        expect(headers).toEqual(expect.arrayContaining(["Identifier", "Type", "Description", "Generated", "ACL", "Creator", "Created", "Modifier",
            "Modified", "Released", "Actions"]));

        const music = within(row("music_collection"));
        expect(music.getByText("tabulated")).not.toBeNull();
        expect(music.getByText("41")).not.toBeNull();
        expect(music.getByText("user 7")).not.toBeNull();
        expect(music.getByText(/2026-01-02 \d\d:00/)).not.toBeNull();
        expect(music.getByText(/2026-01-05 \d\d:00/)).not.toBeNull();
        // never modified: no modifier and no modification time
        expect(music.getAllByText("-")).toHaveLength(2);

        const gps = within(row("gps_series"));
        expect(gps.getByText("Not released")).not.toBeNull();
        expect(gps.getByText("user 9")).not.toBeNull();
        expect(gps.getByText(/2026-01-06 \d\d:00/)).not.toBeNull();
    });

    it("sends the sort column and the release filter to the backend", async () => {
        render(<WebSiteDataPublish/>);
        await screen.findByText("music_collection");

        // The sticky header repeats the titles in a hidden measure row, so the sort clicks target the header cells
        fireEvent.click(screen.getByRole("columnheader", {name: /^Type\b/}));
        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "type", direction: "ASC"})));
        fireEvent.click(screen.getByRole("columnheader", {name: /^Released\b/}));
        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "published"})));

        await userEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: true})));
        await userEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: false})));
    });

    it("searches one column through the column filter", async () => {
        render(<WebSiteDataPublish/>);
        await screen.findByText("music_collection");

        // The filter trigger of the Identifier header opens the shared table's text filter (the placeholder is an i18n key here)
        const identifierHeader = screen.getByRole("columnheader", {name: /^Identifier\b/});
        const trigger = identifierHeader.querySelector(".ant-table-filter-trigger") as HTMLElement;
        expect(trigger).not.toBeNull();
        fireEvent.click(trigger);
        const input = await waitFor(() => {
            const field = document.querySelector(".ant-table-filter-dropdown input") as HTMLInputElement | null;
            expect(field).not.toBeNull();
            return field as HTMLInputElement;
        });
        fireEvent.change(input, {target: {value: "gps"}});
        fireEvent.keyDown(input, {key: "Enter", code: "Enter"});

        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({
            search: "gps", filter_column: "identifier", page: 0
        })));
    });

    it("starts the publishing task of the selected data set and reloads the page once it has finished", async () => {
        const accepted = {task_id: "task-1", type: "PUBLISH_DATA_SET", title: "Publish data set music_collection", status: "QUEUED", total_steps: 1};
        publishDataSet.mockResolvedValue(accepted);
        render(<WebSiteDataPublish/>);
        await screen.findByText("music_collection");
        expect(findPageableDataSets).toHaveBeenCalledTimes(1);

        await userEvent.click(within(row("music_collection")).getByRole("button", {name: "Release to website"}));

        await waitFor(() => {
            expect(publishDataSet).toHaveBeenCalledWith("music_collection");
            expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        });
        expect(findPageableDataSets).toHaveBeenCalledTimes(1);

        // The page is reloaded by the onFinished callback of the tracked task
        const options = trackTask.mock.calls[0][1] as { onFinished: () => void };
        options.onFinished();
        await waitFor(() => expect(findPageableDataSets).toHaveBeenCalledTimes(2));
    });
});

describe("WebSiteDataPublish failures", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("reports a failed publish request", async () => {
        const {message} = jest.requireActual("antd");
        const error = jest.spyOn(message, "error").mockImplementation(() => ({}));
        findPageableDataSets.mockResolvedValue(pagedResponse([buildDataSummary({id: 20, identifier: "music_album_data", description: "Music CD collection"})]));
        publishDataSet.mockRejectedValue(new Error("rejected"));
        render(<WebSiteDataPublish/>);
        await userEvent.click(await screen.findByRole("button", {name: "Release to website"}));
        await waitFor(() => expect(error).toHaveBeenCalledWith("Failed to publish data set 'music_album_data'"));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("shows an empty table when the backend has no data sets", async () => {
        findPageableDataSets.mockResolvedValue(pagedResponse([]));
        render(<WebSiteDataPublish/>);
        await waitFor(() => expect(findPageableDataSets).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole("button", {name: "Release to website"})).toBeNull();
    });
});
