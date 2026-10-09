import {act, fireEvent, render, screen} from "@testing-library/react";
import {Form} from "antd";
import {PagePathInput} from "../content/PagePathInput";

const suggestPath = jest.fn();

jest.mock("../services", () => ({
    pageAPI: {suggestPath: (...args: unknown[]) => suggestPath(...args)}
}));

function Host() {
    const [form] = Form.useForm();
    return (
            <Form form={form} initialValues={{page_path: ""}}>
                <Form.Item name="page_path" label="Path">
                    <PagePathInput debounceMs={50}/>
                </Form.Item>
            </Form>
    );
}

describe("PagePathInput", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        suggestPath.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    async function flush() {
        await act(async () => {
            jest.advanceTimersByTime(60);
            await Promise.resolve();
            await Promise.resolve();
        });
    }

    it("asks the backend after the debounce and offers the common parent path", async () => {
        suggestPath.mockResolvedValue({prefix: "so", suggestion: "some/path", matches: 2});
        render(<Host/>);
        const input = screen.getByRole("combobox");

        fireEvent.change(input, {target: {value: "s"}});
        fireEvent.change(input, {target: {value: "so"}});
        expect(suggestPath).not.toHaveBeenCalled();

        await flush();

        // Only the last keystroke reaches the backend
        expect(suggestPath).toHaveBeenCalledTimes(1);
        expect(suggestPath).toHaveBeenCalledWith("so");
        expect((await screen.findAllByText("some/path")).length).toBeGreaterThan(0);
        expect(screen.getByRole("option", {name: "some/path"})).toBeTruthy();
    });

    it("offers nothing when no page matches or the suggestion equals the typed text", async () => {
        suggestPath.mockResolvedValueOnce({prefix: "zz", suggestion: null, matches: 0});
        render(<Host/>);
        const input = screen.getByRole("combobox");

        fireEvent.change(input, {target: {value: "zz"}});
        await flush();
        expect(suggestPath).toHaveBeenCalledWith("zz");
        expect(screen.queryByRole("option")).toBeNull();

        suggestPath.mockResolvedValueOnce({prefix: "some/path", suggestion: "some/path", matches: 2});
        fireEvent.change(input, {target: {value: "some/path"}});
        await flush();
        expect(screen.queryByRole("option")).toBeNull();
    });

    it("does not query for blank input", async () => {
        render(<Host/>);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "   "}});
        await flush();
        expect(suggestPath).not.toHaveBeenCalled();
    });
});
