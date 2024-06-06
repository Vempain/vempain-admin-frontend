import { useEffect, useState } from "react";
import { Button, Space, Spin, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";
import { useSession } from "../session";
import { PrivilegeEnum, QueryDetailEnum } from "../models";
import { ComponentVO, FormVO } from "../models/Responses";
import { aclTool } from "../tools";
import { formAPI } from "../services";

export function FormList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [formList, setFormList] = useState<FormVO[]>([]);
    const {userSession} = useSession();

    const columns: ColumnsType<FormVO> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: 'Layout ID',
            dataIndex: 'layout_id',
            key: 'layout_id',
            sorter: (a, b) => a.layout_id - b.layout_id
        },
        {
            title: 'Components',
            dataIndex: 'components',
            key: 'components',
            sorter: (a, b) => a.components.length - b.components.length,
            render: (components: ComponentVO[]) => (
                    <div>
                        {components.map((comp, index) => (
                                <span key={comp.id}>{comp.comp_name} {index < components.length - 1 && <br/>}</span>
                        ))}
                    </div>
            )
        },
        {
            title: 'Locked',
            dataIndex: 'locked',
            key: 'locked',
            sorter: (a, b) => Number(b.locked) - Number(a.locked)
        },
        {
            title: 'Creator',
            dataIndex: 'creator',
            key: 'creator',
            sorter: (a, b) => a.creator - b.creator
        },
        {
            title: 'Created',
            dataIndex: 'created',
            key: 'created',
            sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
        },
        {
            title: 'Modifier',
            dataIndex: 'modifier',
            key: 'modifier',
            sorter: (a, b) => a.modifier - b.modifier
        },
        {
            title: 'Modified',
            dataIndex: 'modified',
            key: 'modified',
            sorter: (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
        },
        {
            title: 'Action',
            key: 'action',
            render: (text: any, record: FormVO) => (
                    <Space>
                        <Button type="primary" href={`/forms/${record.id}/edit`}>Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={'primary'} danger href={`/forms/${record.id}/delete`}>Delete</Button>}
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        formAPI.findAll({details: QueryDetailEnum.FULL})
                .then((response) => {
                    setFormList(response);
                    setLoading(false);
                });
    }, []);

    return (
            <div className={'darkBody'} key={'formListDiv'}>
                <Spin tip={'Loading'} spinning={loading} key={'formListSpinner'}>
                    <h1 key={'formListHeader'}>Form List <Link to={'/forms/0/edit'}><PlusCircleFilled/></Link></h1>

                    <Table
                            dataSource={formList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{
                                position: ["topRight", "bottomRight"],
                                defaultPageSize: 15,
                                hideOnSinglePage: true,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                total: formList.length,
                                pageSizeOptions: ["5", "10", "15", "20", "30", "50", "100"]
                            }}
                            key={'formListTable'}/>
                </Spin>
            </div>
    );
}
