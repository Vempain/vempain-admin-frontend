import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {ApiTokens} from "../administration/ApiTokens";
import {isValidNetwork} from "../tools/networkTools";

const list = jest.fn();
const createToken = jest.fn();
const deleteToken = jest.fn();
const defaultNetwork = jest.fn();

jest.mock("../services", () => ({
    userAPI: {
        findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))
    },
    apiTokenAPI: {
        list: (...args: unknown[]) => list(...args),
        createToken: (...args: unknown[]) => createToken(...args),
        deleteToken: (...args: unknown[]) => deleteToken(...args),
        defaultNetwork: (...args: unknown[]) => defaultNetwork(...args)
    }
}));

const stored = {
    id: 3, token_prefix: "vat_k3Jd9Qx2", description: "file backend", network: "10.0.0.0/24", expires_at: "2027-01-01T00:00:00Z",
    owner_user_id: 1, created: "2026-10-09T10:00:00Z", last_used: null, expired: false
};

describe("isValidNetwork", () => {
    it("accepts IPv4 and IPv6 addresses and networks and rejects everything else", () => {
        expect(isValidNetwork("10.1.2.3")).toBe(true);
        expect(isValidNetwork("10.0.0.0/24")).toBe(true);
        expect(isValidNetwork("2001:db8::1")).toBe(true);
        expect(isValidNetwork("2001:db8::/32")).toBe(true);
        expect(isValidNetwork("::1/128")).toBe(true);
        expect(isValidNetwork("10.0.0.0/33")).toBe(false);
        expect(isValidNetwork("2001:db8::/129")).toBe(false);
        expect(isValidNetwork("example.com")).toBe(false);
        expect(isValidNetwork("")).toBe(false);
        expect(isValidNetwork(undefined)).toBe(false);
    });
});

describe("ApiTokens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        list.mockResolvedValue([stored]);
        defaultNetwork.mockResolvedValue({network: null, source: "NONE", candidates: []});
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    it("lists the tokens without their secret", async () => {
        render(<ApiTokens/>);
        await waitFor(() => expect(screen.getByText("vat_k3Jd9Qx2…")).toBeTruthy());
        expect(screen.getByText("file backend")).toBeTruthy();
        expect(screen.getByText("10.0.0.0/24")).toBeTruthy();
        expect(screen.getByText("never")).toBeTruthy();
        // The unpaged token list keeps its header visible below the 60px top bar while scrolling
        expect(document.querySelector(".ant-table-sticky-holder")).toHaveStyle({top: "60px"});
    });

    it("creates a token and shows the secret once", async () => {
        createToken.mockResolvedValue({token: "vat_k3Jd9Qx2SECRET", api_token: stored});
        render(<ApiTokens/>);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByText("Create token"));
        fireEvent.change(await screen.findByPlaceholderText("vempain-file-backend production"), {target: {value: "file backend"}});
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "not a network"}});
        fireEvent.click(screen.getByText("Create"));
        await screen.findByText("Enter an IPv4/IPv6 address or CIDR network");
        expect(createToken).not.toHaveBeenCalled();

        fireEvent.change(screen.getByRole("combobox"), {target: {value: "10.0.0.0/24"}});
        fireEvent.click(screen.getByText("Create"));

        await waitFor(() => expect(createToken).toHaveBeenCalledTimes(1));
        const request = createToken.mock.calls[0][0];
        expect(request.description).toBe("file backend");
        expect(request.network).toBe("10.0.0.0/24");
        expect(new Date(request.expires_at).getTime()).toBeGreaterThan(Date.now());
        await waitFor(() => expect(screen.getByTestId("created-token").textContent).toContain("vat_k3Jd9Qx2SECRET"));
        expect(list).toHaveBeenCalledTimes(2);
    });

    it("pre-fills the network detected from the private network and offers the alternatives", async () => {
        defaultNetwork.mockResolvedValue({
            network: "10.0.9.0/24", source: "PRIVATE_NETWORK",
            candidates: [{network: "10.0.9.0/24", interface_name: "eth1", address: "10.0.9.5"}, {
                network: "172.18.0.0/16",
                interface_name: "eth0",
                address: "172.18.0.3"
            }]
        });
        createToken.mockResolvedValue({token: "vat_prefilledSECRET", api_token: stored});
        render(<ApiTokens/>);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByText("Create token"));
        const networkInput = await screen.findByRole("combobox");
        await waitFor(() => expect((networkInput as HTMLInputElement).value).toBe("10.0.9.0/24"));
        expect(screen.getByText(/Pre-filled with the private network/)).toBeTruthy();

        fireEvent.change(screen.getByPlaceholderText("vempain-file-backend production"), {target: {value: "swarm file backend"}});
        fireEvent.click(screen.getByText("Create"));

        await waitFor(() => expect(createToken).toHaveBeenCalledTimes(1));
        expect(createToken.mock.calls[0][0].network).toBe("10.0.9.0/24");
    });

    it("deletes a token after confirmation", async () => {
        deleteToken.mockResolvedValue(undefined);
        render(<ApiTokens/>);
        await waitFor(() => expect(screen.getByLabelText("Delete token vat_k3Jd9Qx2")).toBeTruthy());

        fireEvent.click(screen.getByLabelText("Delete token vat_k3Jd9Qx2"));
        fireEvent.click(await screen.findByText("Delete"));

        await waitFor(() => expect(deleteToken).toHaveBeenCalledWith(3));
        expect(message.success).toHaveBeenCalled();
        expect(list).toHaveBeenCalledTimes(2);
    });
});

describe("ApiTokens error handling", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it("reports a failed token list load", async () => {
        list.mockRejectedValue(new Error("down"));
        defaultNetwork.mockResolvedValue({network: null, source: "NONE", candidates: []});
        render(<ApiTokens/>);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load the API tokens"));
    });

    it("falls back to manual network entry when the default network can not be fetched and reports a failed creation", async () => {
        list.mockResolvedValue([]);
        defaultNetwork.mockRejectedValue(new Error("no network"));
        createToken.mockRejectedValue(new Error("rejected"));
        render(<ApiTokens/>);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByText("Create token"));
        await waitFor(() => expect(defaultNetwork).toHaveBeenCalled());
        expect(await screen.findByText(/A single address is a \/32/)).toBeTruthy();

        fireEvent.change(screen.getByPlaceholderText("vempain-file-backend production"), {target: {value: "backend"}});
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "10.0.0.1"}});
        fireEvent.click(screen.getByText("Create"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to create the API token"));
    });

    it("explains a configured default network and closes the created-token modal", async () => {
        list.mockResolvedValue([]);
        defaultNetwork.mockResolvedValue({network: "192.168.1.0/24", source: "CONFIGURED", candidates: []});
        createToken.mockResolvedValue({token: "vat_configuredSECRET", api_token: stored});
        render(<ApiTokens/>);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByText("Create token"));
        expect(await screen.findByText(/Pre-filled from the configured default network/)).toBeTruthy();
        fireEvent.change(screen.getByPlaceholderText("vempain-file-backend production"), {target: {value: "backend"}});
        fireEvent.click(screen.getByText("Create"));
        await waitFor(() => expect(screen.getByTestId("created-token").textContent).toContain("vat_configuredSECRET"));

        fireEvent.click(screen.getByText("I have stored the token"));
        await waitFor(() => expect(screen.queryByTestId("created-token")).toBeNull());
    });

    it("reports a failed deletion", async () => {
        list.mockResolvedValue([stored]);
        defaultNetwork.mockResolvedValue({network: null, source: "NONE", candidates: []});
        deleteToken.mockRejectedValue(new Error("nope"));
        render(<ApiTokens/>);
        fireEvent.click(await screen.findByLabelText("Delete token vat_k3Jd9Qx2"));
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to delete the API token"));
        expect(list).toHaveBeenCalledTimes(1);
    });
});

describe("ApiTokens modals", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        list.mockResolvedValue([]);
        defaultNetwork.mockResolvedValue({network: null, source: "NONE", candidates: []});
        createToken.mockResolvedValue({token: "vat_closeSECRET", api_token: stored});
    });

    it("closes the creation modal with Cancel and the created-token modal with its close button", async () => {
        render(<ApiTokens/>);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByText("Create token"));
        await screen.findByPlaceholderText("vempain-file-backend production");
        fireEvent.click(screen.getByText("Cancel"));
        await waitFor(() => expect(screen.queryByPlaceholderText("vempain-file-backend production")).toBeNull());

        fireEvent.click(screen.getByText("Create token"));
        fireEvent.change(await screen.findByPlaceholderText("vempain-file-backend production"), {target: {value: "backend"}});
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "10.0.0.1"}});
        fireEvent.click(screen.getByText("Create"));
        await waitFor(() => expect(screen.getByTestId("created-token").textContent).toContain("vat_closeSECRET"));

        const closeButtons = screen.getAllByLabelText("Close");
        fireEvent.click(closeButtons[closeButtons.length - 1]);
        await waitFor(() => expect(screen.queryByTestId("created-token")).toBeNull());
    });
});
