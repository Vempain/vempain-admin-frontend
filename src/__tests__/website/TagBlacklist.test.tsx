import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {TagBlacklist} from "../../website/TagBlacklist";

const list = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const findById = jest.fn();

jest.mock("../../services", () => ({
    tagBlacklistAPI: {
        list: (...args: unknown[]) => list(...args),
        add: (...args: unknown[]) => add(...args),
        remove: (...args: unknown[]) => remove(...args)
    },
    userAPI: {findById: (...args: unknown[]) => findById(...args)}
}));

jest.mock("@vempain/vempain-auth-frontend", () => ({
    ...jest.requireActual("@vempain/vempain-auth-frontend"),
    UserName: ({id}: { id: number }) => <span>user {id}</span>
}));

const entries = [
    {id: 1, tag_name: "private", created_by: 7, created: "2026-10-26T12:00:00Z"},
    {id: 2, tag_name: "family", created_by: 1, created: "2026-10-25T09:30:00Z"}
];

describe("TagBlacklist", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        list.mockResolvedValue(entries);
    });

    it("lists the blacklisted tags with who added them", async () => {
        render(<TagBlacklist/>);

        expect(await screen.findByText("private")).toBeInTheDocument();
        expect(screen.getByText("family")).toBeInTheDocument();
        expect(screen.getByText("user 7")).toBeInTheDocument();
        expect(screen.getByLabelText("Remove tag private")).toBeInTheDocument();
        expect(list).toHaveBeenCalledTimes(1);
    });

    it("adds a trimmed tag and reloads the list", async () => {
        add.mockResolvedValue({id: 3, tag_name: "work", created_by: 7, created: "2026-10-26T13:00:00Z"});
        render(<TagBlacklist/>);
        await screen.findByText("private");

        fireEvent.change(screen.getByLabelText("Tag to blacklist"), {target: {value: "  work "}});
        fireEvent.click(screen.getByText("Blacklist tag"));

        await waitFor(() => expect(add).toHaveBeenCalledWith({tag_name: "work"}));
        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
        expect(message.success).toHaveBeenCalledWith('Tag "work" blacklisted');
    });

    it("reports a duplicate tag and a failed add", async () => {
        render(<TagBlacklist/>);
        await screen.findByText("private");

        add.mockRejectedValueOnce({response: {status: 409}});
        fireEvent.change(screen.getByLabelText("Tag to blacklist"), {target: {value: "private"}});
        fireEvent.click(screen.getByText("Blacklist tag"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("The tag is already blacklisted"));

        add.mockRejectedValueOnce(new Error("down"));
        fireEvent.change(screen.getByLabelText("Tag to blacklist"), {target: {value: "other"}});
        fireEvent.click(screen.getByText("Blacklist tag"));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to blacklist the tag"));
        expect(list).toHaveBeenCalledTimes(1);
    });

    it("removes a tag after confirmation", async () => {
        remove.mockResolvedValue(undefined);
        render(<TagBlacklist/>);
        await screen.findByText("private");

        fireEvent.click(screen.getByLabelText("Remove tag private"));
        fireEvent.click(await screen.findByText("Remove"));

        await waitFor(() => expect(remove).toHaveBeenCalledWith(1));
        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
        expect(message.success).toHaveBeenCalledWith('Tag "private" removed from the blacklist');
    });

    it("reports a failed load", async () => {
        list.mockRejectedValue(new Error("down"));
        render(<TagBlacklist/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to load the tag blacklist"));
        expect(await screen.findByText("No tags are blacklisted")).toBeInTheDocument();
    });
});
