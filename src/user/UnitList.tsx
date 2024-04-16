import { useEffect, useState } from "react";
import { Button, Spin, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";
import { UnitVO } from "../models/Responses";
import { unitAPI } from "../services";

export function UnitList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [unitList, setUnitList] = useState<UnitVO[]>([]);

    const columns: ColumnsType<UnitVO> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => (a.id || 0) - (b.id || 0),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => a.description.localeCompare(b.description),
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
            sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
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
            sorter: (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (text: any, record: UnitVO) => (
                    <Button type="primary" href={`/units/${record.id}/edit`}>Edit</Button>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        unitAPI.findAll()
                .then((response) => {
                    setUnitList(response);
                    setLoading(false);
                });
    }, []);

    return (
            <div className={'darkBody'} key={'unitListDiv'}>
                <Spin tip={'Loading'} spinning={loading} key={'unitListSpinner'}>
                    <h1 key={'unitListHeader'}>Unit List <Link to={'/units/0/edit'}><PlusCircleFilled/></Link></h1>

                    <Table
                            dataSource={unitList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={{
                                defaultPageSize: 5,
                                hideOnSinglePage: true,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                total: unitList.length,
                                pageSizeOptions: ['5', '10', '20', '30', '50', '100']
                            }}
                            key={'unitListTable'}/>
                </Spin>
            </div>
    );
}
