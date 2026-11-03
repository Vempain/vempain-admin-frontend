import {act, fireEvent, render, screen} from "@testing-library/react";
import {Form} from "antd";
import {PageTagsInput} from "../../content/PageTagsInput";

const search = jest.fn();

jest.mock("../../services", () => ({
    tagAPI: {search: (...args: unknown[]) => search(...args)}
}));

function Host({onValues}: { onValues?: (values: { tags: string[] }) => void }) {
    const [form] = Form.useForm();
    return (
            <Form form={form} initialValues={{tags: ["travel"]}} onValuesChange={(_, values) => onValues?.(values as { tags: string[] })}>
                <Form.Item name="tags" label="Tags">
                    <PageTagsInput debounceMs={50} aria-label="Tags"/>
                </Form.Item>
            </Form>
    );
}

async function flush() {
    await act(async () => {
        jest.advanceTimersByTime(60);
        await Promise.resolve();
        await Promise.resolve();
    });
}

/**
 * The texts of the dropdown items that are not selected yet. Ant Design exposes only the active item and its neighbours as accessible
 * options, so the rendered items are read directly; in tags mode the typed text itself is offered as a new tag next to the suggestions and
 * the tags already chosen are listed as selected items.
 */
function shownOptions(): string[] {
    return Array.from(document.querySelectorAll(".ant-select-item-option:not(.ant-select-item-option-selected)"))
            .map(item => item.getAttribute("title") ?? "");
}

describe("PageTagsInput", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        search.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("shows the existing tags and searches the backend after the debounce while typing", async () => {
        search.mockResolvedValue([{id: 1, tag_name: "summer"}, {id: 2, tag_name: "summer holiday"}]);
        render(<Host/>);
        expect(screen.getByText("travel")).toBeInTheDocument();
        const input = screen.getByRole("combobox");

        fireEvent.mouseDown(input);
        await flush();
        // opening the field lists the first tags without a search text
        expect(search).toHaveBeenCalledWith("");

        fireEvent.change(input, {target: {value: "s"}});
        fireEvent.change(input, {target: {value: "sum"}});
        expect(search).toHaveBeenCalledTimes(1);
        await flush();

        // only the last keystroke reaches the backend
        expect(search).toHaveBeenCalledTimes(2);
        expect(search).toHaveBeenLastCalledWith("sum");
        expect(shownOptions().sort()).toEqual(["sum", "summer", "summer holiday"]);
    });

    it("adds a picked suggestion to the tags of the form", async () => {
        search.mockResolvedValue([{id: 1, tag_name: "summer"}]);
        const onValues = jest.fn();
        render(<Host onValues={onValues}/>);
        const input = screen.getByRole("combobox");
        fireEvent.change(input, {target: {value: "sum"}});
        await flush();

        fireEvent.click(document.querySelector('.ant-select-item-option[title="summer"]')!);
        expect(onValues).toHaveBeenLastCalledWith({tags: ["travel", "summer"]});
    });

    it("logs a failed search and offers nothing", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        search.mockRejectedValue(new Error("offline"));
        render(<Host/>);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "sum"}});
        await flush();
        expect(error).toHaveBeenCalledWith("Failed to fetch tag suggestions:", expect.any(Error));
        // only the typed text is offered, as a new tag
        expect(shownOptions()).toEqual(["sum"]);
        error.mockRestore();
    });

    it("ignores the answer of a superseded search", async () => {
        let resolveFirst: (value: unknown) => void = () => undefined;
        search
                .mockImplementationOnce(() => new Promise(resolve => {
                    resolveFirst = resolve;
                }))
                .mockResolvedValueOnce([{id: 2, tag_name: "winter"}]);
        render(<Host/>);
        const input = screen.getByRole("combobox");
        fireEvent.change(input, {target: {value: "s"}});
        await flush();
        fireEvent.change(input, {target: {value: "w"}});
        await flush();
        expect(search).toHaveBeenCalledTimes(2);

        await act(async () => {
            resolveFirst([{id: 1, tag_name: "stale"}]);
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(shownOptions().sort()).toEqual(["w", "winter"]);
    });
});
