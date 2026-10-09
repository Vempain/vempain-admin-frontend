import {render, screen, waitFor} from "@testing-library/react";
import dayjs from "dayjs";
import {MetadataForm} from "../main/MetadataForm";
import {clearUserNameCache} from "../tools/userNames";

const findById = jest.fn();

jest.mock("../services", () => ({
    userAPI: {findById: (...args: unknown[]) => findById(...args)}
}));

describe("MetadataForm", () => {
    beforeEach(() => {
        findById.mockReset();
        clearUserNameCache();
    });

    it("renders a compact read-only line with resolved user names and 24h timestamps", async () => {
        findById.mockImplementation((id: number) => Promise.resolve(id === 1
                ? {id: 1, name: "Admin User", login_name: "admin"}
                : {id: 2, name: "Editor", login_name: "editor"}));

        const {container} = render(<MetadataForm metadata={{
            creator: 1,
            created: dayjs("2026-10-09T15:04:05Z"),
            modifier: 2,
            modified: "2026-10-10T07:30:00Z"
        }}/>);

        expect(screen.getByText("Created by")).toBeTruthy();
        expect(screen.getByText("Created")).toBeTruthy();
        expect(screen.getByText("Modified by")).toBeTruthy();
        expect(screen.getByText("Modified")).toBeTruthy();
        // Until resolved the ids are shown as #id, then as name (login)
        await waitFor(() => expect(screen.getByText("Admin User (admin)")).toBeTruthy());
        await waitFor(() => expect(screen.getByText("Editor (editor)")).toBeTruthy());
        expect(screen.getByText(dayjs("2026-10-09T15:04:05Z").format("YYYY-MM-DD HH:mm"))).toBeTruthy();
        expect(screen.getByText(dayjs("2026-10-10T07:30:00Z").format("YYYY-MM-DD HH:mm"))).toBeTruthy();
        expect(container.querySelectorAll("input")).toHaveLength(0);
        expect(findById).toHaveBeenCalledTimes(2);
    });

    it("shows dashes for a never modified entity and falls back to the id when the lookup fails", async () => {
        findById.mockRejectedValue(new Error("no access"));

        render(<MetadataForm metadata={{creator: 9, created: "2026-01-01T00:00:00Z", modifier: null, modified: null}}/>);

        await waitFor(() => expect(screen.getByText("#9")).toBeTruthy());
        expect(screen.getAllByText("–")).toHaveLength(2);
        expect(findById).toHaveBeenCalledTimes(1);
    });

    it("looks every user up only once across instances", async () => {
        findById.mockResolvedValue({id: 1, name: "Admin User", login_name: "admin"});

        render(<>
            <MetadataForm metadata={{creator: 1, created: "2026-01-01T00:00:00Z", modifier: 1, modified: "2026-01-02T00:00:00Z"}}/>
            <MetadataForm metadata={{creator: 1, created: "2026-01-03T00:00:00Z"}}/>
        </>);

        await waitFor(() => expect(screen.getAllByText("Admin User (admin)")).toHaveLength(3));
        expect(findById).toHaveBeenCalledTimes(1);
    });
});
