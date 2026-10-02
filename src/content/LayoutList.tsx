import {useMemo} from "react";
import {Button, Space, Spin, Switch} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {DeleteOutlined, EditOutlined, PlusCircleFilled} from "@ant-design/icons";
import {type LayoutVO} from "../models";
import {formatDateTime} from "../tools";
import {aclTool, PrivilegeEnum, usePagedTable, useSession, VempainTable} from "@vempain/vempain-auth-frontend";
import {layoutAPI} from "../services";

export function LayoutList() {
    const {userSession} = useSession();
    const paged = usePagedTable<LayoutVO>(request => layoutAPI.findPageable(request), {
        defaultSortBy: "id",
        defaultDirection: "DESC",
        defaultPageSize: 10
    });

    const columns: ColumnsType<LayoutVO> = useMemo(() => [
        {title: "ID", dataIndex: "id", key: "id", defaultSortOrder: "descend", sorter: true},
        {title: "Layout Name", dataIndex: "layout_name", key: "layout_name", defaultSortOrder: "descend", sorter: true, searchable: true},
        {title: "Creator", dataIndex: "creator", key: "creator", sorter: true},
        {title: "Created", dataIndex: "created", key: "created", sorter: true, render: (_, record) => formatDateTime(record.created)},
        {title: "Modifier", dataIndex: "modifier", key: "modifier", sorter: true},
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: true,
            render: (_, record) => record.modified === null ? "-" : formatDateTime(record.modified)
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: LayoutVO) => (
                    <Space>
                        <Button type="primary" href={`/layouts/${record.id}/edit`}><EditOutlined/></Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type="primary" danger href={`/layouts/${record.id}/delete`}><DeleteOutlined/></Button>}
                    </Space>
            )
        }
    ], [userSession?.id, userSession?.units]);

    return (
            <div className={"DarkDiv"} key={"layoutListDiv"}>
                <Spin description={"Loading"} spinning={paged.loading} key={"layoutListSpinner"}>
                    <h1 key={"layoutListHeader"}>Layout List <Link to={"/layouts/0/edit"}><PlusCircleFilled/></Link>
                        <Switch checked={paged.caseSensitive}
                                onChange={paged.setCaseSensitive}
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
                            key={"layoutListTable"}/>}
                </Spin>
            </div>
    );
}
