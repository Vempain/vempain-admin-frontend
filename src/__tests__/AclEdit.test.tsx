import {render, screen, waitFor} from "@testing-library/react";
import {Form} from "antd";
import {AclEdit} from "../content/AclEdit";

const loadUsersAndUnits = jest.fn();
const sharedEditor = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => ({
    loadUsersAndUnits: (...args: unknown[]) => loadUsersAndUnits(...args),
    AclEditor: (props: unknown) => {
        sharedEditor(props);
        return <div data-testid="shared-acl-editor"/>;
    }
}), {virtual: true});

jest.mock("../services", () => ({
    userAPI: {kind: "users"},
    unitAPI: {kind: "units"}
}));

function Host() {
    const [form] = Form.useForm();
    return <Form form={form}><AclEdit acls={[]} parentForm={form}/></Form>;
}

describe("AclEdit", () => {
    it("loads this backend's users and units and hands them to the shared editor", async () => {
        loadUsersAndUnits.mockResolvedValue({users: [{id: 1, name: "A", login_name: "a"}], units: [{id: 2, name: "U"}]});

        render(<Host/>);

        await waitFor(() => expect(screen.getByTestId("shared-acl-editor")).toBeTruthy());
        expect(loadUsersAndUnits).toHaveBeenCalledWith({kind: "users"}, {kind: "units"});
        const props = sharedEditor.mock.calls.at(-1)[0];
        expect(props.users).toEqual([{id: 1, name: "A", login_name: "a"}]);
        expect(props.units).toEqual([{id: 2, name: "U"}]);
        expect(props.acls).toEqual([]);
    });
});
