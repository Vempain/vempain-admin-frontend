import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {WebSiteConfiguration} from "../../website/WebSiteConfiguration";
import {WebSiteConfigurationTypeEnum} from "../../models";
import {webSiteConfiguration} from "../helpers/testData";

const getAllConfigurations = jest.fn();
const updateConfiguration = jest.fn();

jest.mock("../../services", () => ({
    webSiteManagementAPI: {
        getAllConfigurations: (...args: unknown[]) => getAllConfigurations(...args),
        updateConfiguration: (...args: unknown[]) => updateConfiguration(...args)
    }
}));

const title = webSiteConfiguration();
const pageSize = webSiteConfiguration({
    id: "site.page_size",
    config_key: "site.page_size",
    config_type: WebSiteConfigurationTypeEnum.NUMBER,
    config_default: "10",
    config_value: "20"
});
const dark = webSiteConfiguration({
    id: "site.dark",
    config_key: "site.dark",
    config_type: WebSiteConfigurationTypeEnum.BOOLEAN,
    config_default: "false",
    config_value: "true"
});
const tags = webSiteConfiguration({
    id: "site.tags",
    config_key: "site.tags",
    config_type: WebSiteConfigurationTypeEnum.List,
    config_default: "",
    config_value: ""
});
const emptyNumber = webSiteConfiguration({
    id: "site.limit",
    config_key: "site.limit",
    config_type: WebSiteConfigurationTypeEnum.NUMBER,
    config_default: "",
    config_value: ""
});

function row(key: string): HTMLElement {
    return screen.getAllByText(key)[0].closest("tr") as HTMLElement;
}

describe("WebSiteConfiguration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        getAllConfigurations.mockResolvedValue([title, pageSize, dark, tags, emptyNumber]);
    });

    afterEach(() => jest.restoreAllMocks());

    it("lists every configuration with an editor matching its type and a disabled update button", async () => {
        render(<WebSiteConfiguration/>);
        expect((await screen.findAllByText("site.title")).length).toBe(2);
        expect(within(row("site.title")).getByDisplayValue("My site")).toBeInTheDocument();
        expect(within(row("site.page_size")).getByRole("spinbutton")).toHaveValue("20");
        expect(within(row("site.dark")).getByRole("switch")).toBeChecked();
        expect(within(row("site.limit")).getByRole("spinbutton")).toHaveValue("0");
        expect(within(row("site.tags")).getAllByText("—").length).toBeGreaterThan(0);
        expect(within(row("site.title")).getByRole("button", {name: "Update"})).toBeDisabled();
    });

    it("updates a text value once it differs from the stored one", async () => {
        updateConfiguration.mockResolvedValue({...title, config_value: "New title"});
        render(<WebSiteConfiguration/>);
        const input = await screen.findByDisplayValue("My site");
        fireEvent.change(input, {target: {value: "New title"}});
        const update = within(row("site.title")).getByRole("button", {name: "Update"});
        expect(update).toBeEnabled();
        fireEvent.click(update);

        await waitFor(() => expect(updateConfiguration).toHaveBeenCalledWith({...title, config_value: "New title"}));
        expect(message.success).toHaveBeenCalledWith("Configuration \"site.title\" updated");
        await waitFor(() => expect(within(row("site.title")).getByRole("button", {name: "Update"})).toBeDisabled());
    });

    it("updates number and boolean values in their serialized form", async () => {
        updateConfiguration.mockImplementation(async (request: typeof pageSize) => request);
        render(<WebSiteConfiguration/>);
        await screen.findAllByText("site.page_size");

        const number = within(row("site.page_size")).getByRole("spinbutton");
        fireEvent.change(number, {target: {value: "35"}});
        fireEvent.blur(number);
        fireEvent.click(within(row("site.page_size")).getByRole("button", {name: "Update"}));
        await waitFor(() => expect(updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({id: "site.page_size", config_value: "35"})));

        fireEvent.click(within(row("site.dark")).getByRole("switch"));
        fireEvent.click(within(row("site.dark")).getByRole("button", {name: "Update"}));
        await waitFor(() => expect(updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({id: "site.dark", config_value: "false"})));

        const limit = within(row("site.limit")).getByRole("spinbutton");
        fireEvent.change(limit, {target: {value: "4"}});
        fireEvent.blur(limit);
        fireEvent.click(within(row("site.limit")).getByRole("button", {name: "Update"}));
        await waitFor(() => expect(updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({id: "site.limit", config_value: "4"})));
    });

    it("reports load and update failures", async () => {
        getAllConfigurations.mockRejectedValueOnce(new Error("down"));
        render(<WebSiteConfiguration/>);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load configuration data"));

        updateConfiguration.mockRejectedValue(new Error("rejected"));
        render(<WebSiteConfiguration/>);
        const input = await screen.findByDisplayValue("My site");
        fireEvent.change(input, {target: {value: "Other"}});
        fireEvent.click(within(input.closest("tr") as HTMLElement).getByRole("button", {name: "Update"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to update configuration"));
    });
});
