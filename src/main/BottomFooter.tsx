import {Footer} from "antd/es/layout/layout";
import BuildInfoData from "../buildInfo.json";
import type {BuildInfo} from "@vempain/vempain-auth-frontend";
import {sanitizeFooterMarkup} from "../tools/footerSecurity";

function BottomFooter() {
    const buildInfo: BuildInfo = BuildInfoData;
    const footerMarkup = sanitizeFooterMarkup(
            import.meta.env.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER + "<br/>"
            + "v" + buildInfo.version + " " + " built: " + buildInfo.buildTime + "<br/>"
            + import.meta.env.VITE_APP_POWERED_BY_VEMPAIN,
    );

    return (
            <Footer style={{textAlign: "center"}}
                    dangerouslySetInnerHTML={{
                        __html: footerMarkup,
                    }}/>
    );
}

export {BottomFooter};