import {useMemo} from "react";
import {Button, Space, Spin, Switch} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {DeleteOutlined, EditOutlined, PlusCircleFilled} from "@ant-design/icons";
import {type FormVO} from "../models";
import {formatDateTime} from "../tools";
import {aclTool, PrivilegeEnum, usePagedTable, useSession, VempainTable} from "@vempain/vempain-auth-frontend";
import {formAPI} from "../services";

export function FormList() {
    const {userSession} = useSession();
    const paged = usePagedTable<FormVO>(request => formAPI.findPageable(request), {
        defaultSortBy: "id",
        defaultDirection: "ASC",
        defaultPageSize: 10
    });

    const columns: ColumnsType<FormVO> = useMemo(() => [
        {title: "ID", dataIndex: "id", key: "id", sorter: true},
        {title: "Name", dataIndex: "name", key: "name", sorter: true, searchable: true},
        {title: "Layout ID", dataIndex: "layout_id", key: "layout_id", sorter: true},
        {
            title: "Components",
            dataIndex: "components",
            key: "components",
            sorter: true,
            render: (_text: string, record: FormVO) => (
                    <div>{record.components.map((comp, index) => (
                            <span key={`${record.id}-${comp.id}-${index}`}>
                                {index}: {comp.comp_name} {index < record.components.length - 1 && <br/>}
                            </span>
                    ))}</div>
            )
        },
        {title: "Locked", dataIndex: "locked", key: "locked", sorter: true},
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
            render: (_text: Record<string, unknown>, record: FormVO) => (
                    <Space>
                        <Button type="primary" href={`/forms/${record.id}/edit`}><EditOutlined/></Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type="primary" danger href={`/forms/${record.id}/delete`}><DeleteOutlined/></Button>}
                    </Space>
            )
        }
    ], [userSession?.id, userSession?.units]);

    return (
            <div className={"DarkDiv"} key={"formListDiv"}>
                <Spin description={"Loading"} spinning={paged.loading} key={"formListSpinner"}>
                    <h1 key={"formListHeader"}>Form List <Link to={"/forms/0/edit"}><PlusCircleFilled/></Link>
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
                            key={"formListTable"}/>}
                </Spin>
            </div>
    );
}
