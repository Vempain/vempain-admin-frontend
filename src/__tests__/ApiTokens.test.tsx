import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {ApiTokens} from "../administration/ApiTokens";
import {isValidNetwork} from "../tools/networkTools";

const list = jest.fn();
const createToken = jest.fn();
const deleteToken = jest.fn();
const defaultNetwork = jest.fn();

jest.mock("../services", () => ({
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
