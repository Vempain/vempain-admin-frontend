import { useEffect, useState } from "react";
import { Button, Space, Spin, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";
import { useSession } from "../session";
import { PrivilegeEnum } from "../models";
import { LayoutVO } from "../models/Responses";
import { aclTool } from "../tools";
import { layoutAPI } from "../services";

export function LayoutList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [layoutList, setLayoutList] = useState<LayoutVO[]>([]);
    const {userSession} = useSession();

    const columns: ColumnsType<LayoutVO> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.id - b.id
        },
        {
            title: 'Layout Name',
            dataIndex: 'layout_name',
            key: 'layout_name',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.layout_name.localeCompare(b.layout_name),
        },
        {
            title: 'Creator',
            dataIndex: 'creator',
            key: 'creator',
            sorter: (a, b) => a.creator - b.creator,
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
            sorter: (a, b) => a.modifier - b.modifier,
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
            render: (text: any, record: any) => (
                    <Space>
                        <Button type={'primary'} href={`/layouts/${record.id}/edit`}>Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={'primary'} danger href={`/layouts/${record.id}/delete`}>Delete</Button>}
                    </Space>
            )
        }
    ];

    useEffect(() => {
        setLoading(true);
        layoutAPI.findAll()
                .then((response) => {
                    setLayoutList(response);
                    setLoading(false);
                });
    }, []);

    return (
            <div className={'darkBody'} key={'layoutListDiv'}>
                <Spin tip={'Loading'} spinning={loading} key={'layoutListSpinner'}>
                    <h1 key={'layoutListHeader'}>Layout List <Link to={'/layouts/0/edit'}><PlusCircleFilled/></Link></h1>

                    <Table
                            dataSource={layoutList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{
                                position: ["topRight", "bottomRight"],
                                defaultPageSize: 15,
                                hideOnSinglePage: true,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                total: layoutList.length,
                                pageSizeOptions: ["5", "10", "15", "20", "30", "50", "100"]
                            }}
                            key={'layoutListTable'}/>
                </Spin>
            </div>
    );
}
