import {useEffect, useState} from "react";
import type {ColumnsType} from "antd/lib/table";
import {Button, Space, Spin, Table, type TablePaginationConfig} from "antd";
import {PlusCircleFilled} from "@ant-design/icons";
import {Link} from "react-router-dom";
import {type ComponentVO} from "../models";
import {getPaginationConfig} from "../tools";
import {componentAPI} from "../services";
import {aclTool, PrivilegeEnum, useSession} from "@vempain/vempain-auth-frontend";

export function ComponentList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [componentList, setComponentList] = useState<ComponentVO[]>([]);
    const {userSession} = useSession();
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const columns: ColumnsType<ComponentVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Component Name",
            dataIndex: "comp_name",
            key: "comp_name",
            sorter: (a, b) => a.comp_name.localeCompare(b.comp_name)
        },
        {
            title: "Locked",
            dataIndex: "locked",
            key: "locked",
            sorter: (a, b) => Number(b.locked) - Number(a.locked)
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: (a, b) => a.creator - b.creator
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: (a, b) => a.modifier - b.modifier
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
        },
        {
            title: "Action",
            key: "action",
            render: (_text: any, record: ComponentVO) => (
                    <Space>
                        <Button type="primary" href={`/components/${record.id}/edit`}>Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"} danger href={`/components/${record.id}/delete`}>Delete</Button>}
                    </Space>

            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        componentAPI.findAll()
                .then((response) => {
                    setComponentList(response);
                    setPagination(getPaginationConfig(response.length));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <div className={"DarkDiv"} key={"componentListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"componentListSpinner"}>
                    <h1 key={"componentListHeader"}>Component List <Link to={"/components/0/edit"}><PlusCircleFilled/></Link></h1>

                    {componentList.length > 0 && <Table
                            dataSource={componentList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={pagination}
                            key={"componentListTable"}/>}
                </Spin>
            </div>
    );
}
