import {render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {Statistics} from "../administration/Statistics";
import {resourceTypeLabel} from "../tools/statisticsTools";
import {statisticsAPI} from "../services";
import type {AdminStatisticsResponse} from "../models";

jest.mock("@ant-design/charts", () => ({
    Column: () => <div data-testid="column-chart"/>,
    Line: () => <div data-testid="line-chart"/>,
}));

jest.mock("../services", () => ({
    statisticsAPI: {getStatistics: jest.fn()},
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()}),
});

const getStatistics = jest.mocked(statisticsAPI.getStatistics);

const statistics: AdminStatisticsResponse = {
    generated_at: "2026-10-26T10:00:00Z",
    resource_counts: [
        {name: "page", count: 12}, {name: "gallery", count: 3}, {name: "site_file", count: 240},
        {name: "component", count: 5}, {name: "form", count: 2}, {name: "layout", count: 1},
    ],
    files_by_type: [{name: "IMAGE", count: 230}, {name: "VIDEO", count: 10}],
    publish_states: [
        {resource_type: "page", published: 9, not_published: 3},
        {resource_type: "gallery", published: 0, not_published: 3},
        {resource_type: "site_file", published: 240, not_published: 0},
    ],
    published_by_month: [{resource_type: "page", month: "2026-10", count: 9}],
    created_by_month: [{resource_type: "page", month: "2026-09", count: 4}, {resource_type: "page", month: "2026-10", count: 8}],
    resources_by_user: [
        {user_id: 1, nick: "admin", resource_type: "page", count: 10},
        {user_id: 1, nick: "admin", resource_type: "site_file", count: 240},
        {user_id: 7, nick: null, resource_type: "page", count: 2},
    ],
    pages_by_form: [{name: "Article", count: 12}],
    forms_by_layout: [{name: "Main layout", count: 2}],
    forms_by_component: [{name: "Header component", count: 2}],
    pages_by_path: [{name: "/blog", count: 10}, {name: "/", count: 2}],
    files_by_path: [{name: "/uploads/2026/", count: 240}],
};

describe("Statistics", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    it("shows the counts and every breakdown of the backend", async () => {
        getStatistics.mockResolvedValue(statistics);
        render(<Statistics/>);

        const overview = await screen.findByTestId("statistics-overview");
        expect(within(overview).getByText("Site files")).toBeInTheDocument();
        expect(within(overview).getByText("240")).toBeInTheDocument();
        expect(within(overview).getByText("Galleries")).toBeInTheDocument();
        expect(screen.getAllByTestId("column-chart")).toHaveLength(2);
        expect(screen.getAllByTestId("line-chart")).toHaveLength(2);

        expect(screen.getByText("IMAGE")).toBeInTheDocument();
        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
        expect(screen.getByText("admin")).toBeInTheDocument();
        expect(screen.getByText("user #7")).toBeInTheDocument();
        expect(screen.getByText("250")).toBeInTheDocument();
        expect(screen.getByText("Article")).toBeInTheDocument();
        expect(screen.getByText("Main layout")).toBeInTheDocument();
        expect(screen.getByText("Header component")).toBeInTheDocument();
        expect(screen.getByText("/blog")).toBeInTheDocument();
        expect(screen.getByText("/uploads/2026/")).toBeInTheDocument();
        expect(getStatistics).toHaveBeenCalledTimes(1);
    });

    it("reports a failed load", async () => {
        getStatistics.mockRejectedValue(new Error("down"));
        render(<Statistics/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load the statistics"));
        expect(screen.queryByTestId("statistics-overview")).toBeNull();
    });

    it("labels the resource types", () => {
        expect(resourceTypeLabel("site_file")).toBe("Site files");
        expect(resourceTypeLabel("other")).toBe("other");
    });
});
