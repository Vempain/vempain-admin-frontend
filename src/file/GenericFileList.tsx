import {useEffect, useState} from "react";
import {Spin, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {FilterValue, SorterResult} from "antd/es/table/interface";
import {type PagedResponse} from "@vempain/vempain-auth-frontend";
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
    const [loading, setLoading] = useState(false);
    const [valueObjectList, setValueObjectList] = useState<T[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 15,
        total: 0,
        placement: ["topEnd", "bottomEnd"],
        showSizeChanger: true,
        hideOnSinglePage: false,
        pageSizeOptions: ["5", "10", "15", "20", "30", "50", "100"]
    });
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [search, setSearch] = useState("");
    const [filterColumn, setFilterColumn] = useState("");

    function handleTableChange(
            nextPagination: TablePaginationConfig,
            filters: Record<string, FilterValue | null>,
            sorter: SorterResult<T> | SorterResult<T>[]
    ) {
        const primarySorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const filterEntry = Object.entries(filters).find(([, value]) => value?.length);
        const filterValue = filterEntry?.[1]?.[0];

        setPagination((current) => ({
            ...current,
            current: nextPagination.current ?? 1,
            pageSize: nextPagination.pageSize ?? current.pageSize ?? 15
        }));
        setSortField(primarySorter?.field?.toString() || "id");
        setSortOrder(primarySorter?.order === "descend" ? "desc" : "asc");
        setFilterColumn(filterEntry?.[0] ?? "");
        setSearch(filterValue?.toString() ?? "");
    }

    const currentPage = pagination.current ?? 1;
    const currentPageSize = pagination.pageSize ?? 15;

    useEffect(() => {
        const request: SiteFilePagedRequest = {
            page: currentPage - 1,
            size: currentPageSize,
            sort_by: sortField,
            direction: sortOrder === "desc" ? "DESC" : "ASC",
            search: search || undefined,
            filter_column: filterColumn || undefined,
            file_type: requestParams.file_type
        };

        setLoading(true);
        api.getPagedSiteFiles(request)
                .then((response) => {
                    setValueObjectList(response.content);
                    setPagination((current) => ({
                        ...current,
                        current: response.page + 1,
                        pageSize: response.size,
                        total: response.total_elements
                    }));
                })
                .catch((error: unknown) => {
                    console.error(error);
                })
                .finally(() => setLoading(false));
    }, [api, filterColumn, currentPage, currentPageSize, requestParams.file_type, search, sortField, sortOrder]);

    return (
            <div className={"DarkDiv"}>
                <Spin spinning={loading}>
                    <Table dataSource={valueObjectList}
                           columns={valueObjectColumns}
                           pagination={pagination}
                           loading={loading}
                           rowKey={"id"}
                           onChange={handleTableChange}
                    />
                </Spin>
            </div>
    );
}
