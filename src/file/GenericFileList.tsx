import {useState} from "react";
import {Space, Spin} from "antd";
import type {ColumnsType} from "antd/es/table";
import {type PagedResponse, usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import type {SiteFilePagedRequest} from "../models";
import {ReleaseFilterSwitch} from "../main/ReleaseFilterSwitch";
import {stickyTableHeader} from "../tools";

interface PageableApi<T> {
    getPagedSiteFiles(request: SiteFilePagedRequest): Promise<PagedResponse<T>>;
}

interface Props<T extends { id: number }> {
    valueObjectColumns: ColumnsType<T>;
    api: PageableApi<T>;
    requestParams: Pick<SiteFilePagedRequest, "file_type">;
}

export function GenericFileList<T extends { id: number }>({valueObjectColumns, api, requestParams}: Props<T>) {
    const [modifiedAfterPublish, setModifiedAfterPublish] = useState(false);
    const paged = usePagedTable<T>(request => api.getPagedSiteFiles({
        ...request,
        file_type: requestParams.file_type,
        modified_after_publish: modifiedAfterPublish
    }), {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 15,
        deps: [requestParams.file_type, modifiedAfterPublish]
    });

    return (
            <div className={"DarkDiv"}>
                <Spin spinning={paged.loading}>
                    {paged.contextHolder}
                    <Space vertical={true} size={"middle"} style={{width: "100%"}}>
                        <ReleaseFilterSwitch checked={modifiedAfterPublish} onChange={setModifiedAfterPublish}/>
                        <VempainTable dataSource={paged.dataSource}
                                      sticky={stickyTableHeader}
                                      columns={valueObjectColumns}
                                      dataMode={"server"}
                                      paged={paged}
                                      loading={paged.loading}
                                      rowKey={"id"}
                        />
                    </Space>
                </Spin>
            </div>
    );
}
