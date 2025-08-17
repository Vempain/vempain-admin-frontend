import {useEffect, useRef, useState} from "react";
import {Spin, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {FilterValue, SorterResult} from "antd/es/table/interface";

interface Props<T extends { id: number }> {
    valueObjectColumns: ColumnsType<T>;
    api: any; // Define the type for your API
    // New: optional extra request params to send along with the pageable request
    requestParams?: Record<string, unknown>;
}

export function GenericFileList<T extends { id: number }>({valueObjectColumns, api, requestParams}: Props<T>) {
    const [loading, setLoading] = useState<boolean>(false);
    const [valueObjectList, setValueObjectList] = useState<T[]>([]);
    const defaultFilterColumn: string = "id";

    const [tablePaginationConfig, setTablePaginationConfig] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        position: ["topRight", "bottomRight"],
        defaultPageSize: 15,
        total: 0,
        showSizeChanger: true,
        hideOnSinglePage: false,
        pageSizeOptions: ["5", "10", "15", "20", "30", "50", "100"]
    });

    const [tableParams, setTableParams] = useState({
        sortField: "",
        sortOrder: "",
        pagination: tablePaginationConfig,
        columnKey: defaultFilterColumn,
        field: defaultFilterColumn,
        order: "descend",
        filter: "",
        filters: {},
        filterColumn: defaultFilterColumn
    });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    const refreshDataFromServer = useRef(true); // useRef to track whether data should be fetched or not

    function handleTableChange(tablePaginationConfig: TablePaginationConfig, filters: Record<string, FilterValue | null>,
                               sorter: SorterResult<T> | SorterResult<T>[]) {
        setTablePaginationConfig(tablePaginationConfig);

        if (filters) {
            setTableParams({
                ...tableParams,
                pagination: tablePaginationConfig,
                filters: filters,
            });
        }

        if (sorter) {
            // At this point we only sort by one column
            let primarySorter: null | SorterResult<T>;

            if (Array.isArray(sorter)) {
                primarySorter = sorter[0];
            } else {
                primarySorter = sorter;
            }

            setTableParams({
                ...tableParams,
                pagination: tablePaginationConfig,
                field: primarySorter.field === undefined ? defaultFilterColumn : primarySorter.field.toString(),
                order: primarySorter.order === "ascend" ? "asc" : "desc"
            });
        }

        refreshDataFromServer.current = true;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    useEffect(() => {
        setLoading(true);
        api.findPageable({
            page_number: (tablePaginationConfig.current === undefined ? 0 : (tablePaginationConfig.current - 1)),
            page_size: tablePaginationConfig.pageSize,
            sorting: tableParams.field ? `${tableParams.field},${tableParams.order}` : null,
            filter: tableParams.filter,
            filter_column: defaultFilterColumn,
            // New: include any extra params (e.g. file_type)
            ...(requestParams ?? {})
        })
                .then((response: any) => {
                    setValueObjectList(response.content);
                })
                .catch((error: any) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [defaultFilterColumn, tableParams, tablePaginationConfig, api, requestParams]);

    return (
            <div className={"DarkDiv"}>
                <h4> {}</h4>

                <Spin spinning={loading}>
                    <Table dataSource={valueObjectList}
                           columns={valueObjectColumns}
                           pagination={tablePaginationConfig}
                           loading={loading}
                           rowKey={"id"}
                           onChange={handleTableChange}
                    />
                </Spin>

            </div>
    );
}