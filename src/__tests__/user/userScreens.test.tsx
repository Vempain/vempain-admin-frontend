import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {UnitList} from "../../user/UnitList";
import {UserList} from "../../user/UserList";
import {UnitEditor} from "../../user/UnitEditor";
import {UserEditor} from "../../user/UserEditor";

const sharedUnitList = jest.fn();
const sharedUserList = jest.fn();
const sharedUnitEditor = jest.fn();
const sharedUserEditor = jest.fn();
const useSession = jest.fn();

jest.mock("@vempain/vempain-auth-frontend", () => {
    const actual = jest.requireActual("@vempain/vempain-auth-frontend");
    return {
        ...actual,
        useSession: () => useSession(),
        UnitList: (props: { onEdit: (id: number) => void; onCreate: () => void }) => {
            sharedUnitList(props);
            return <div>
                <button onClick={() => props.onEdit(3)}>edit unit</button>
                <button onClick={props.onCreate}>new unit</button>
            </div>;
        },
        UserList: (props: { onEdit: (id: number) => void; onCreate: () => void }) => {
            sharedUserList(props);
            return <div>
                <button onClick={() => props.onEdit(4)}>edit user</button>
                <button onClick={props.onCreate}>new user</button>
            </div>;
        },
        UnitEditor: (props: { onSaved: () => void; onCancel: () => void; renderMetadata: (m: unknown) => ReactNode }) => {
            sharedUnitEditor(props);
            return <div>
                <button onClick={props.onSaved}>save unit</button>
                <button onClick={props.onCancel}>cancel unit</button>
                {props.renderMetadata({creator: 1, created: "2026-01-02T10:00:00Z", modifier: null, modified: null})}
            </div>;
        },
        UserEditor: (props: { onSaved: () => void; onCancel: () => void; renderMetadata: (m: unknown) => ReactNode }) => {
            sharedUserEditor(props);
            return <div>
                <button onClick={props.onSaved}>save user</button>
                <button onClick={props.onCancel}>cancel user</button>
                {props.renderMetadata({creator: 1, created: "2026-01-02T10:00:00Z", modifier: null, modified: null})}
            </div>;
        }
    };
});

jest.mock("../../services", () => ({
    unitAPI: {kind: "units", findById: jest.fn()},
    userAPI: {kind: "users", findById: jest.fn(async () => ({id: 1, name: "Admin", nick: "admin"}))}
}));

function renderRoute(route: string, path: string, element: React.ReactElement) {
    return render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={element}/>
                    <Route path="/units" element={<div>units list</div>}/>
                    <Route path="/units/:paramId/edit" element={<div>unit editor route</div>}/>
                    <Route path="/users" element={<div>users list</div>}/>
                    <Route path="/users/:paramId/edit" element={<div>user editor route</div>}/>
                </Routes>
            </MemoryRouter>
    );
}

describe("user and unit hosts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useSession.mockReturnValue({userSession: {id: 7, nickname: "admin"}});
    });

    it("binds the shared unit list to this backend's unit API and navigates to the editor", async () => {
        renderRoute("/units-host", "/units-host", <UnitList/>);
        expect(sharedUnitList.mock.calls[0][0].unitAPI).toEqual(expect.objectContaining({kind: "units"}));
        fireEvent.click(screen.getByText("edit unit"));
        expect(await screen.findByText("unit editor route")).toBeInTheDocument();
    });

    it("navigates to a new unit from the unit list", async () => {
        renderRoute("/units-host", "/units-host", <UnitList/>);
        fireEvent.click(screen.getByText("new unit"));
        expect(await screen.findByText("unit editor route")).toBeInTheDocument();
    });

    it("binds the shared user list to this backend's user API and navigates to the editor", async () => {
        renderRoute("/users-host", "/users-host", <UserList/>);
        expect(sharedUserList.mock.calls[0][0].userAPI).toEqual(expect.objectContaining({kind: "users"}));
        fireEvent.click(screen.getByText("edit user"));
        expect(await screen.findByText("user editor route")).toBeInTheDocument();
    });

    it("navigates to a new user from the user list", async () => {
        renderRoute("/users-host", "/users-host", <UserList/>);
        fireEvent.click(screen.getByText("new user"));
        expect(await screen.findByText("user editor route")).toBeInTheDocument();
    });

    it("hosts the shared unit editor with the current user and returns to the list when saved", async () => {
        renderRoute("/units/3/edit", "/units/:paramId/edit", <UnitEditor/>);
        const props = sharedUnitEditor.mock.calls[0][0];
        expect(props.unitId).toBe(3);
        expect(props.currentUserId).toBe(7);
        expect(props.unitAPI).toEqual(expect.objectContaining({kind: "units"}));
        expect(props.userAPI).toEqual(expect.objectContaining({kind: "users"}));
        expect(screen.getByText("Created by")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText("Admin (admin)")).toBeInTheDocument());
        fireEvent.click(screen.getByText("save unit"));
        expect(await screen.findByText("units list")).toBeInTheDocument();
    });

    it("returns to the unit list when editing is cancelled and rejects an invalid unit id", async () => {
        useSession.mockReturnValue({userSession: null});
        const view = renderRoute("/units/0/edit", "/units/:paramId/edit", <UnitEditor/>);
        expect(sharedUnitEditor.mock.calls[0][0].currentUserId).toBeUndefined();
        fireEvent.click(screen.getByText("cancel unit"));
        expect(await screen.findByText("units list")).toBeInTheDocument();
        view.unmount();

        renderRoute("/units/-1/edit", "/units/:paramId/edit", <UnitEditor/>);
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/units");
    });

    it("hosts the shared user editor with the current user and returns to the list when saved or cancelled", async () => {
        const view = renderRoute("/users/4/edit", "/users/:paramId/edit", <UserEditor/>);
        const props = sharedUserEditor.mock.calls[0][0];
        expect(props.userId).toBe(4);
        expect(props.currentUserId).toBe(7);
        expect(screen.getByText("Created by")).toBeInTheDocument();
        fireEvent.click(screen.getByText("save user"));
        expect(await screen.findByText("users list")).toBeInTheDocument();
        view.unmount();

        useSession.mockReturnValue({userSession: null});
        renderRoute("/users/0/edit", "/users/:paramId/edit", <UserEditor/>);
        expect(sharedUserEditor.mock.calls.at(-1)[0].currentUserId).toBeUndefined();
        fireEvent.click(screen.getByText("cancel user"));
        expect(await screen.findByText("users list")).toBeInTheDocument();
    });

    it("rejects an invalid user id", () => {
        renderRoute("/users/-5/edit", "/users/:paramId/edit", <UserEditor/>);
        expect(screen.getByText("Called with invalid parameter")).toBeInTheDocument();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/users");
    });
});
