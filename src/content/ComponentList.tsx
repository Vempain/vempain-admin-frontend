import {useMemo} from "react";
import type {ColumnsType} from "antd/lib/table";
import {Button, Space, Spin, Switch} from "antd";
import {DeleteOutlined, EditOutlined, PlusCircleFilled} from "@ant-design/icons";
import {Link} from "react-router-dom";
import {type ComponentVO} from "../models";
import {aclTool, PrivilegeEnum, usePagedTable, useSession, VempainTable} from "@vempain/vempain-auth-frontend";
import {formatDateTime} from "../tools";
import {componentAPI} from "../services";

export function ComponentList() {
    const {userSession} = useSession();
    const paged = usePagedTable<ComponentVO>(request => componentAPI.findPageable(request), {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 10
    });

    const columns: ColumnsType<ComponentVO> = useMemo(() => [
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
            searchable: true
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
    ], [userSession?.id, userSession?.units]);

    return (
            <div className={"DarkDiv"} key={"componentListDiv"}>
                <Spin description={"Loading"} spinning={paged.loading} key={"componentListSpinner"}>
                    <h1 key={"componentListHeader"}>Component List <Link to={"/components/0/edit"}><PlusCircleFilled/></Link>
                        <Switch checked={paged.caseSensitive}
                                onChange={checked => paged.setCaseSensitive(checked)}
                                checkedChildren="Aa" unCheckedChildren="aa" style={{marginLeft: 16}}/>
                    </h1>

                    {paged.contextHolder}
                    {paged.dataSource.length > 0 && <VempainTable
                            dataSource={paged.dataSource}
                            columns={columns}
                            dataMode={"server"}
                            paged={paged}
                            loading={paged.loading}
                            rowKey={(_record, index) => `row_${index}`}
                            key={"componentListTable"}/>}
                </Spin>
            </div>
    );
}
