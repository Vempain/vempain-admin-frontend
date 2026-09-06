import {useEffect, useRef, useState} from "react";
import {Button, Input, type InputRef, Space, Spin, Switch, Table, type TableColumnType, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {DeleteOutlined, EditOutlined, PlusCircleFilled, SearchOutlined} from "@ant-design/icons";
import {type LayoutVO} from "../models";
import {formatDateTime} from "../tools";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {aclTool, PrivilegeEnum, useSession} from "@vempain/vempain-auth-frontend";
import type {FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {layoutAPI} from "../services";

export function LayoutList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [layoutList, setLayoutList] = useState<LayoutVO[]>([]);
    const {userSession} = useSession();
    const [pagedRequest, setPagedRequest] = useState<PagedRequest>({page: 0, size: 10, sort_by: "id", direction: "DESC", case_sensitive: false});
    const [totalElements, setTotalElements] = useState(0);
    const searchInput = useRef<InputRef>(null);
    const getColumnSearchProps = (dataIndex: keyof LayoutVO): TableColumnType<LayoutVO> => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}: FilterDropdownProps) => (
                <div style={{padding: 8}}>
                    <Input ref={searchInput} value={selectedKeys[0]} onChange={event => setSelectedKeys(event.target.value ? [event.target.value] : [])}
                           onPressEnter={() => confirm()} style={{marginBottom: 8}}/>
                    <Space><Button type="primary" size="small" icon={<SearchOutlined/>} onClick={() => confirm()}>Search</Button>
                        <Button size="small" onClick={() => {
                            clearFilters?.();
                            confirm();
                        }}>Reset</Button></Space>
                </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
        filteredValue: pagedRequest.search ? [pagedRequest.search] : null,
        dataIndex
    });

    const columns: ColumnsType<LayoutVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            defaultSortOrder: "descend",
            sorter: true
        },
        {
            title: "Layout Name",
            dataIndex: "layout_name",
            key: "layout_name",
            defaultSortOrder: "descend",
            sorter: true,
            ...getColumnSearchProps("layout_name"),
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: true,
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: true,
            render: (_: Record<string, unknown>, record: LayoutVO) => {
                return formatDateTime(record.created);
            }
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: true,
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_: Record<string, unknown>, record: LayoutVO) => {
                if (record.modified === null) {
                    return "-";
                }
                return formatDateTime(record.modified);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: LayoutVO) => (
                    <Space>
                        <Button type={"primary"} href={`/layouts/${record.id}/edit`}><EditOutlined/></Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"} danger href={`/layouts/${record.id}/delete`}><DeleteOutlined/></Button>}
                    </Space>
            )
        }
    ];

    useEffect(() => {
        setLoading(true);
        layoutAPI.findPageable(pagedRequest)
                .then((response) => {
                    setLayoutList(response.content);
                    setTotalElements(response.total_elements);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [pagedRequest]);

    function handleTableChange(pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>,
                               sorter: SorterResult<LayoutVO> | SorterResult<LayoutVO>[]): void {
        const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const search = Object.values(filters).flatMap(value => value ?? []).find(value => typeof value === "string" && value.length > 0);
        setPagedRequest(previous => ({
            ...previous, page: (pagination.current ?? 1) - 1, size: pagination.pageSize ?? previous.size,
            sort_by: typeof currentSorter.field === "string" ? currentSorter.field : "id",
            direction: currentSorter.order === "descend" ? "DESC" : "ASC", search: typeof search === "string" ? search : undefined
        }));
    }

    return (
            <div className={"DarkDiv"} key={"layoutListDiv"}>
                <Spin description={"Loading"} spinning={loading} key={"layoutListSpinner"}>
                    <h1 key={"layoutListHeader"}>Layout List <Link to={"/layouts/0/edit"}><PlusCircleFilled/></Link>
                        <Switch checked={pagedRequest.case_sensitive}
                                onChange={checked => setPagedRequest(previous => ({...previous, page: 0, case_sensitive: checked}))}
                                checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                    </h1>

                    {layoutList.length > 0 && <Table
                            dataSource={layoutList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{current: pagedRequest.page + 1, pageSize: pagedRequest.size, total: totalElements, showSizeChanger: true}}
                            onChange={handleTableChange}
                            key={"layoutListTable"}/>}
                </Spin>
            </div>
    );
}
