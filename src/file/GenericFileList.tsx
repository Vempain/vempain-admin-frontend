import {type ReactNode, useState} from "react";
import {Space, Spin} from "antd";
import type {TableRowSelection} from "antd/es/table/interface";
import {type PagedResponse, usePagedTable, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import type {SiteFilePagedRequest} from "../models";
import {ReleaseFilterSwitch} from "../main/ReleaseFilterSwitch";
import {stickyTableHeader} from "../tools";

interface PageableApi<T> {
    getPagedSiteFiles(request: SiteFilePagedRequest): Promise<PagedResponse<T>>;
}

interface Props<T extends { id: number }> {
    /** The columns, or a builder of them when the row actions need the callback that reloads the current page */
    valueObjectColumns: VempainColumnsType<T> | ((reload: () => void) => VempainColumnsType<T>);
    api: PageableApi<T>;
    requestParams: Pick<SiteFilePagedRequest, "file_type">;
    /** Row selection of the table, when the list offers actions on the selected rows */
    rowSelection?: TableRowSelection<T>;
    /** Controls shown above the table; the callback reloads the current page */
    toolbar?: (reload: () => void) => ReactNode;
    /** Shown as loading while an action of the list is running */
    actionLoading?: boolean;
}

export function GenericFileList<T extends { id: number }>({valueObjectColumns, api, requestParams, rowSelection, toolbar, actionLoading = false}: Props<T>) {
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

    const columns = typeof valueObjectColumns === "function" ? valueObjectColumns(paged.reload) : valueObjectColumns;

    return (
            <div className={"DarkDiv"}>
                <Spin spinning={paged.loading || actionLoading}>
                    {paged.contextHolder}
                    <Space vertical={true} size={"middle"} style={{width: "100%"}}>
                        {toolbar?.(paged.reload)}
                        <ReleaseFilterSwitch checked={modifiedAfterPublish} onChange={setModifiedAfterPublish}/>
                        <VempainTable dataSource={paged.dataSource}
                                      sticky={stickyTableHeader}
                                      columns={columns}
                                      dataMode={"server"}
                                      paged={paged}
                                      loading={paged.loading || actionLoading}
                                      rowKey={"id"}
                                      rowSelection={rowSelection}
                        />
                    </Space>
                </Spin>
            </div>
    );
}
