import {render, screen} from "@testing-library/react";
import {ActionResult} from "@vempain/vempain-auth-frontend";
import {Home} from "../../main/Home";
import {SubmitResultHandler} from "../../main/SubmitResultHandler";
import {BottomFooter} from "../../main/BottomFooter";
import {testEnv} from "../helpers/renderUtils";

describe("Home", () => {
    it("renders the landing heading", () => {
        render(<Home/>);
        expect(screen.getByRole("heading", {name: "Home"})).toBeInTheDocument();
    });
});

describe("SubmitResultHandler", () => {
    it("shows a success alert with a link back to the success target", () => {
        render(<SubmitResultHandler submitResult={{status: ActionResult.OK, message: "Saved"}} successTo="/pages" failTo="/error"/>);
        expect(screen.getByText("Saved")).toBeInTheDocument();
        expect(document.querySelector(".ant-alert-success")).not.toBeNull();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/pages");
    });

    it("shows an error alert with a link back to the failure target", () => {
        render(<SubmitResultHandler submitResult={{status: ActionResult.FAIL, message: "Broken"}} successTo="/pages" failTo="/error"/>);
        expect(screen.getByText("Broken")).toBeInTheDocument();
        expect(document.querySelector(".ant-alert-error")).not.toBeNull();
        expect(screen.getByText("Back").closest("a")).toHaveAttribute("href", "/error");
    });
});

describe("BottomFooter", () => {
    it("renders the sanitized copyright, version and powered-by markup", () => {
        testEnv.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER = "Vempain project © 2026";
        testEnv.VITE_APP_POWERED_BY_VEMPAIN = "Powered by <a href=\"https://vempain.poltsi.fi/\" onclick=\"evil()\">Vempain</a><script>x()</script>";
        const {container} = render(<BottomFooter/>);
        const footer = container.querySelector("footer") as HTMLElement;
        expect(footer.innerHTML).toContain("Vempain project © 2026");
        expect(footer.innerHTML).toMatch(/v.* built: /);
        expect(footer.querySelector("a")).toHaveAttribute("href", "https://vempain.poltsi.fi/");
        expect(footer.innerHTML).not.toContain("onclick");
        expect(footer.innerHTML).not.toContain("<script>");
    });
});
