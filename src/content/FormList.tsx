import {useEffect, useRef, useState} from "react";
import {Button, Input, type InputRef, Space, Spin, Switch, Table, type TableColumnType, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {DeleteOutlined, EditOutlined, PlusCircleFilled, SearchOutlined} from "@ant-design/icons";
import {type FormVO} from "../models";
import {formatDateTime} from "../tools";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {aclTool, PrivilegeEnum, useSession} from "@vempain/vempain-auth-frontend";
import type {FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {formAPI} from "../services";

export function FormList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [formList, setFormList] = useState<FormVO[]>([]);
    const {userSession} = useSession();
    const [pagedRequest, setPagedRequest] = useState<PagedRequest>({page: 0, size: 10, sort_by: "id", direction: "ASC", case_sensitive: false});
    const [totalElements, setTotalElements] = useState(0);
    const searchInput = useRef<InputRef>(null);
    const getColumnSearchProps = (dataIndex: keyof FormVO): TableColumnType<FormVO> => ({
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

    const columns: ColumnsType<FormVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: true
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: true,
            ...getColumnSearchProps("name")
        },
        {
            title: "Layout ID",
            dataIndex: "layout_id",
            key: "layout_id",
            sorter: true
        },
        {
            title: "Components",
            dataIndex: "components",
            key: "components",
            sorter: true,
            render: (_text: string, record: FormVO) => {
                const spans = [];
                for (let i = 0; i < record.components.length; i++) {
                    const comp = record.components[i];
                    spans.push(
                            <span key={`${record.id}-${comp.id}-${i}`}>
                {i}: {comp.comp_name} {i < record.components.length - 1 && <br/>}
            </span>
                    );
                }
                return <div>{spans}</div>;
            }
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
            render: (_: Record<string, unknown>, record: FormVO) => {
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
            render: (_: Record<string, unknown>, record: FormVO) => {
                if (record.modified === null) {
                    return "-";
                }
                return formatDateTime(record.modified);
            }
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: FormVO) => (
                    <Space>
                        <Button type="primary" href={`/forms/${record.id}/edit`}><EditOutlined/></Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"} danger href={`/forms/${record.id}/delete`}><DeleteOutlined/></Button>}
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        formAPI.findPageable(pagedRequest)
                .then((response) => {
                    setFormList(response.content);
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
                               sorter: SorterResult<FormVO> | SorterResult<FormVO>[]): void {
        const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const search = Object.values(filters).flatMap(value => value ?? []).find(value => typeof value === "string" && value.length > 0);
        setPagedRequest(previous => ({
            ...previous, page: (pagination.current ?? 1) - 1, size: pagination.pageSize ?? previous.size,
            sort_by: typeof currentSorter.field === "string" ? currentSorter.field : "id",
            direction: currentSorter.order === "descend" ? "DESC" : "ASC", search: typeof search === "string" ? search : undefined
        }));
    }

    return (
            <div className={"DarkDiv"} key={"formListDiv"}>
                <Spin description={"Loading"} spinning={loading} key={"formListSpinner"}>
                    <h1 key={"formListHeader"}>Form List <Link to={"/forms/0/edit"}><PlusCircleFilled/></Link>
                        <Switch checked={pagedRequest.case_sensitive}
                                onChange={checked => setPagedRequest(previous => ({...previous, page: 0, case_sensitive: checked}))}
                                checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                    </h1>

                    {formList.length > 0 && <Table
                            dataSource={formList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{current: pagedRequest.page + 1, pageSize: pagedRequest.size, total: totalElements, showSizeChanger: true}}
                            onChange={handleTableChange}
                            key={"formListTable"}/>}
                </Spin>
            </div>
    );
}
