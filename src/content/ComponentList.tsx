import {useEffect, useRef, useState} from "react";
import type {ColumnsType} from "antd/lib/table";
import {Button, Input, type InputRef, Space, Spin, Switch, Table, type TableColumnType, type TablePaginationConfig} from "antd";
import {DeleteOutlined, EditOutlined, PlusCircleFilled, SearchOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";
import {type ComponentVO} from "../models";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {aclTool, PrivilegeEnum, useSession} from "@vempain/vempain-auth-frontend";
import {formatDateTime} from "../tools";
import type {FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {componentAPI} from "../services";

export function ComponentList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [componentList, setComponentList] = useState<ComponentVO[]>([]);
    const {userSession} = useSession();
    const [pagedRequest, setPagedRequest] = useState<PagedRequest>({page: 0, size: 10, sort_by: "id", direction: "ASC", case_sensitive: false});
    const [totalElements, setTotalElements] = useState(0);
    const searchInput = useRef<InputRef>(null);

    const getColumnSearchProps = (dataIndex: keyof ComponentVO): TableColumnType<ComponentVO> => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}: FilterDropdownProps) => (
                <div style={{padding: 8}}>
                    <Input ref={searchInput} value={selectedKeys[0]} onChange={event => setSelectedKeys(event.target.value ? [event.target.value] : [])}
                           onPressEnter={() => confirm()} style={{marginBottom: 8}}/>
                    <Space>
                        <Button type="primary" size="small" icon={<SearchOutlined/>} onClick={() => confirm()}>Search</Button>
                        <Button size="small" onClick={() => {
                            clearFilters?.();
                            confirm();
                        }}>Reset</Button>
                    </Space>
                </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
        filteredValue: pagedRequest.search ? [pagedRequest.search] : null,
        dataIndex
    });

    const columns: ColumnsType<ComponentVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true
        },
        {
            title: "Component Name",
            dataIndex: "comp_name",
            key: "comp_name",
            sorter: true,
            ...getColumnSearchProps("comp_name")
        },
        {
            title: "Locked",
            dataIndex: "locked",
            key: "locked",
            sorter: true
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: true
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: true,
            render: (_: Record<string, unknown>, record: ComponentVO) => {
                return formatDateTime(record.created);
            }
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: true
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_: Record<string, unknown>, record: ComponentVO) => {
                if (record.modified === null) {
                    return "-";
                }
                return formatDateTime(record.modified);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: ComponentVO) => (
                    <Space>
                        <Button type="primary" href={`/components/${record.id}/edit`}><EditOutlined/></Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"} danger href={`/components/${record.id}/delete`}><DeleteOutlined/></Button>}
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        componentAPI.findPageable(pagedRequest)
                .then((response) => {
                    setComponentList(response.content);
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
                               sorter: SorterResult<ComponentVO> | SorterResult<ComponentVO>[]): void {
        const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const search = Object.values(filters).flatMap(value => value ?? []).find(value => typeof value === "string" && value.length > 0);
        setPagedRequest(previous => ({
            ...previous, page: (pagination.current ?? 1) - 1, size: pagination.pageSize ?? previous.size,
            sort_by: typeof currentSorter.field === "string" ? currentSorter.field : "id",
            direction: currentSorter.order === "descend" ? "DESC" : "ASC", search: typeof search === "string" ? search : undefined
        }));
    }

    return (
            <div className={"DarkDiv"} key={"componentListDiv"}>
                <Spin description={"Loading"} spinning={loading} key={"componentListSpinner"}>
                    <h1 key={"componentListHeader"}>Component List <Link to={"/components/0/edit"}><PlusCircleFilled/></Link>
                        <Switch checked={pagedRequest.case_sensitive}
                                onChange={checked => setPagedRequest(previous => ({...previous, page: 0, case_sensitive: checked}))}
                                checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                    </h1>

                    {componentList.length > 0 && <Table
                            dataSource={componentList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{current: pagedRequest.page + 1, pageSize: pagedRequest.size, total: totalElements, showSizeChanger: true}}
                            onChange={handleTableChange}
                            key={"componentListTable"}/>}
                </Spin>
            </div>
    );
}
