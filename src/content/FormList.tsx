import {useEffect, useState} from "react";
import {Button, Space, Spin, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {PlusCircleFilled} from "@ant-design/icons";
import {type FormVO, QueryDetailEnum} from "../models";
import {aclTool, getPaginationConfig} from "../tools";
import {formAPI} from "../services";
import {PrivilegeEnum, useSession} from "@vempain/vempain-auth-frontend";

export function FormList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [formList, setFormList] = useState<FormVO[]>([]);
    const {userSession} = useSession();
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const columns: ColumnsType<FormVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Layout ID",
            dataIndex: "layout_id",
            key: "layout_id",
            sorter: (a, b) => a.layout_id - b.layout_id
        },
        {
            title: "Components",
            dataIndex: "components",
            key: "components",
            sorter: (a, b) => a.components.length - b.components.length,
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
            render: (_text: any, record: FormVO) => (
                    <Space>
                        <Button type="primary" href={`/forms/${record.id}/edit`}>Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={"primary"} danger href={`/forms/${record.id}/delete`}>Delete</Button>}
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        formAPI.findAll({details: QueryDetailEnum.FULL})
                .then((response) => {
                    setFormList(response);
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
            <div className={"darkBody"} key={"formListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"formListSpinner"}>
                    <h1 key={"formListHeader"}>Form List <Link to={"/forms/0/edit"}><PlusCircleFilled/></Link></h1>

                    {formList.length > 0 && <Table
                            dataSource={formList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={pagination}
                            key={"formListTable"}/>}
                </Spin>
            </div>
    );
}
