import {Spin} from "antd";
import type {ColumnsType} from "antd/es/table";
import {type PagedResponse, usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import type {SiteFilePagedRequest} from "../models";

interface PageableApi<T> {
    getPagedSiteFiles(request: SiteFilePagedRequest): Promise<PagedResponse<T>>;
}

interface Props<T extends { id: number }> {
    valueObjectColumns: ColumnsType<T>;
    api: PageableApi<T>;
    requestParams: Pick<SiteFilePagedRequest, "file_type">;
}

export function GenericFileList<T extends { id: number }>({valueObjectColumns, api, requestParams}: Props<T>) {
    const paged = usePagedTable<T>(request => api.getPagedSiteFiles({
        ...request,
        file_type: requestParams.file_type
    }), {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 15,
        deps: [requestParams.file_type]
    });

    return (
            <div className={"DarkDiv"}>
                <Spin spinning={paged.loading}>
                    {paged.contextHolder}
                    <VempainTable dataSource={paged.dataSource}
                           columns={valueObjectColumns}
                                  dataMode={"server"}
                                  paged={paged}
                                  loading={paged.loading}
                           rowKey={"id"}
                    />
                </Spin>
            </div>
    );
}
