import {fireEvent, screen, waitFor} from "@testing-library/react";
import {ComponentEditor} from "../../content/ComponentEditor";
import {FormEditor} from "../../content/FormEditor";
import {LayoutEditor} from "../../content/LayoutEditor";
import {componentVO, formVO, layoutVO, pagedResponse} from "../helpers/testData";
import {renderAt, selectOption} from "../helpers/renderUtils";

const componentAPI = {findById: jest.fn(), create: jest.fn(), update: jest.fn(), findPageable: jest.fn()};
const formAPI = {findById: jest.fn(), create: jest.fn(), update: jest.fn()};
const layoutAPI = {findById: jest.fn(), create: jest.fn(), update: jest.fn(), findPageable: jest.fn()};
const aclEdit = jest.fn();

jest.mock("../../services", () => ({
    userAPI: {findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))},
    componentAPI: {
        findById: (...a: unknown[]) => componentAPI.findById(...a),
        create: (...a: unknown[]) => componentAPI.create(...a),
        update: (...a: unknown[]) => componentAPI.update(...a),
        findPageable: (...a: unknown[]) => componentAPI.findPageable(...a)
    },
    formAPI: {
        findById: (...a: unknown[]) => formAPI.findById(...a),
        create: (...a: unknown[]) => formAPI.create(...a),
        update: (...a: unknown[]) => formAPI.update(...a)
    },
    layoutAPI: {
        findById: (...a: unknown[]) => layoutAPI.findById(...a),
        create: (...a: unknown[]) => layoutAPI.create(...a),
        update: (...a: unknown[]) => layoutAPI.update(...a),
        findPageable: (...a: unknown[]) => layoutAPI.findPageable(...a)
    }
}));

// Like the shared editor, the stub keeps the ACL rows in the parent form's `acls` field (unless the host already registers it)
jest.mock("../../content/AclEdit", () => {
    const {Form} = jest.requireActual("antd");
    const AclField = () => <div data-testid="acl-edit"/>;
    return {
        AclEdit: (props: { acls: unknown[]; value?: unknown }) => {
            aclEdit(props);
            return "value" in props ? <AclField/> : <Form.Item name="acls" noStyle><AclField/></Form.Item>;
        }
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "debug").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    componentAPI.findById.mockResolvedValue(componentVO());
    componentAPI.create.mockImplementation(async (values: unknown) => ({...componentVO(), ...(values as object), id: 10}));
    componentAPI.update.mockImplementation(async (values: unknown) => ({...componentVO(), ...(values as object)}));
    componentAPI.findPageable.mockResolvedValue(pagedResponse([componentVO(), componentVO({id: 6, comp_name: "Footer component"})]));
    formAPI.findById.mockResolvedValue(formVO());
    formAPI.create.mockImplementation(async (values: unknown) => ({...formVO(), ...(values as object), id: 11}));
    formAPI.update.mockImplementation(async (values: unknown) => ({...formVO(), ...(values as object)}));
    layoutAPI.findById.mockResolvedValue(layoutVO());
    layoutAPI.create.mockImplementation(async (values: unknown) => ({...layoutVO(), ...(values as object), id: 12}));
    layoutAPI.update.mockImplementation(async (values: unknown) => ({...layoutVO(), ...(values as object)}));
    layoutAPI.findPageable.mockResolvedValue(pagedResponse([layoutVO(), layoutVO({id: 2, layout_name: "Old layout"})]));
});

afterEach(() => jest.restoreAllMocks());

describe("ComponentEditor", () => {
    const path = "/components/:paramId/edit";

    it("creates a new component from the form values", async () => {
        renderAt(<ComponentEditor/>, {route: "/components/0/edit", path});
        expect(await screen.findByText("Create new component")).toBeInTheDocument();
        expect(screen.getByTestId("acl-edit")).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("Component Name"), {target: {value: "Menu"}});
        fireEvent.change(screen.getByLabelText("Component data"), {target: {value: "<nav/>"}});
        fireEvent.click(screen.getByLabelText("Locked"));
        fireEvent.click(screen.getByText("Save"));

        await waitFor(() => expect(componentAPI.create).toHaveBeenCalledTimes(1));
        expect(componentAPI.create.mock.calls[0][0]).toMatchObject({id: 0, comp_name: "Menu", comp_data: "<nav/>", locked: true, acls: []});
        expect(await screen.findByText("Component created successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/components");
    });

    it("updates an existing component with completed ACL rows and the audit trail shown", async () => {
        renderAt(<ComponentEditor/>, {route: "/components/3/edit", path});
        expect(await screen.findByText("Edit component 3")).toBeInTheDocument();
        expect(await screen.findByDisplayValue("Header component")).toBeInTheDocument();
        expect(aclEdit.mock.calls.at(-1)[0].acls).toHaveLength(1);
        await waitFor(() => expect(screen.getAllByText("Admin (admin)").length).toBe(2));

        fireEvent.change(screen.getByLabelText("Component Name"), {target: {value: "Header v2"}});
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(componentAPI.update).toHaveBeenCalledTimes(1));
        const payload = componentAPI.update.mock.calls[0][0];
        expect(payload.comp_name).toBe("Header v2");
        expect(payload.acls[0]).toMatchObject({user: 7, read_privilege: true});
        expect(await screen.findByText("Component updated successfully")).toBeInTheDocument();
    });

    it("reports failed saves, a failed load and an invalid id", async () => {
        componentAPI.create.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<ComponentEditor/>, {route: "/components/0/edit", path});
        fireEvent.click(await screen.findByText("Save"));
        expect(await screen.findByText("Failed to create a new component")).toBeInTheDocument();

        componentAPI.update.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<ComponentEditor/>, {route: "/components/3/edit", path});
        await screen.findByDisplayValue("Header component");
        fireEvent.click(screen.getByText("Save"));
        expect(await screen.findByText("Failed to update component")).toBeInTheDocument();

        componentAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<ComponentEditor/>, {route: "/components/3/edit", path});
        expect(await screen.findByText("Failed to fetch the component, try again later")).toBeInTheDocument();

        renderAt(<ComponentEditor/>, {route: "/components/-1/edit", path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});

describe("LayoutEditor", () => {
    const path = "/layouts/:paramId/edit";

    it("creates a new layout from the form values", async () => {
        renderAt(<LayoutEditor/>, {route: "/layouts/0/edit", path});
        expect(await screen.findByText("Create new layout")).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("Layout Name"), {target: {value: "Fresh"}});
        fireEvent.change(screen.getByLabelText("Structure"), {target: {value: "<!--a-->"}});
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(layoutAPI.create).toHaveBeenCalledTimes(1));
        expect(layoutAPI.create.mock.calls[0][0]).toMatchObject({id: 0, layout_name: "Fresh", structure: "<!--a-->", acls: []});
        expect(await screen.findByText("Layout created successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/layouts");
    });

    it("updates an existing layout", async () => {
        renderAt(<LayoutEditor/>, {route: "/layouts/4/edit", path});
        expect(await screen.findByText("Edit layout 4")).toBeInTheDocument();
        await screen.findByDisplayValue("Main layout");
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(layoutAPI.update).toHaveBeenCalledTimes(1));
        expect(layoutAPI.update.mock.calls[0][0].acls[0]).toMatchObject({user: 7});
        expect(await screen.findByText("Layout updated successfully")).toBeInTheDocument();
    });

    it("reports failed saves, a failed load and an invalid id", async () => {
        layoutAPI.create.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<LayoutEditor/>, {route: "/layouts/0/edit", path});
        fireEvent.click(await screen.findByText("Save"));
        expect(await screen.findByText("Failed to create a new layout")).toBeInTheDocument();

        layoutAPI.update.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<LayoutEditor/>, {route: "/layouts/4/edit", path});
        await screen.findByDisplayValue("Main layout");
        fireEvent.click(screen.getByText("Save"));
        expect(await screen.findByText("Failed to update layout")).toBeInTheDocument();

        layoutAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<LayoutEditor/>, {route: "/layouts/4/edit", path});
        expect(await screen.findByText("Failed to fetch the layout, try again later")).toBeInTheDocument();

        renderAt(<LayoutEditor/>, {route: "/layouts/-1/edit", path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});

describe("FormEditor", () => {
    const path = "/forms/:paramId/edit";

    it("creates a new form with a layout and components picked from the lists", async () => {
        renderAt(<FormEditor/>, {route: "/forms/0/edit", path});
        expect(await screen.findByText("Create new form")).toBeInTheDocument();
        await waitFor(() => expect(componentAPI.findPageable).toHaveBeenCalledWith({page: 0, size: 200, sort_by: "comp_name", direction: "ASC"}));
        expect(layoutAPI.findPageable).toHaveBeenCalledWith({page: 0, size: 200, sort_by: "layout_name", direction: "ASC"});

        fireEvent.change(screen.getByLabelText("Form name"), {target: {value: "Blog form"}});
        await selectOption(screen.getByLabelText("Layout"), "Main layout");

        fireEvent.click(screen.getByText("Add component"));
        fireEvent.click(screen.getByText("Add component"));
        const componentSelects = screen.getAllByRole("combobox").slice(1);
        expect(componentSelects).toHaveLength(2);
        await selectOption(componentSelects[0], "Header component");
        await selectOption(componentSelects[1], "Footer component");
        const removeButtons = document.querySelectorAll(".anticon-minus-circle");
        fireEvent.click(removeButtons[1].closest("button") as HTMLElement);
        expect(screen.getAllByRole("combobox").slice(1)).toHaveLength(1);

        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(formAPI.create).toHaveBeenCalledTimes(1));
        expect(formAPI.create.mock.calls[0][0]).toMatchObject({id: 0, name: "Blog form", layout_id: 4, components: [{id: 3}]});
        expect(await screen.findByText("Form created successfully")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/forms");
    });

    it("updates an existing form", async () => {
        renderAt(<FormEditor/>, {route: "/forms/5/edit", path});
        expect(await screen.findByText("Edit form 5")).toBeInTheDocument();
        await screen.findByDisplayValue("Article form");
        await waitFor(() => expect(screen.getByText("Main layout")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(formAPI.update).toHaveBeenCalledTimes(1));
        expect(formAPI.update.mock.calls[0][0]).toMatchObject({id: 5, name: "Article form", layout_id: 4});
        expect(await screen.findByText("Form updated successfully")).toBeInTheDocument();
    });

    it("reports failed saves, failed loads and an invalid id", async () => {
        formAPI.create.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<FormEditor/>, {route: "/forms/0/edit", path});
        fireEvent.click(await screen.findByText("Save"));
        expect(await screen.findByText("Failed to create a new form")).toBeInTheDocument();

        formAPI.update.mockRejectedValueOnce(new Error("rejected"));
        renderAt(<FormEditor/>, {route: "/forms/5/edit", path});
        await screen.findByDisplayValue("Article form");
        fireEvent.click(screen.getByText("Save"));
        expect(await screen.findByText("Failed to update form")).toBeInTheDocument();

        formAPI.findById.mockRejectedValueOnce(new Error("down"));
        renderAt(<FormEditor/>, {route: "/forms/5/edit", path});
        expect(await screen.findByText("Failed to fetch the form, try again later")).toBeInTheDocument();

        layoutAPI.findPageable.mockRejectedValueOnce(new Error("down"));
        renderAt(<FormEditor/>, {route: "/forms/0/edit", path});
        expect(await screen.findByText("Failed to fetch the component and layout list, try again later")).toBeInTheDocument();

        renderAt(<FormEditor/>, {route: "/forms/-1/edit", path});
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
    });
});
