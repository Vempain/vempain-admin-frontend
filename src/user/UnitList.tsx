import {useEffect, useState} from "react";
import {Button, Spin, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {EditOutlined, PlusCircleFilled} from "@ant-design/icons";
import {unitAPI} from "../services";
import {getPaginationConfig} from "../tools";
import type {UnitVO} from "@vempain/vempain-auth-frontend";
import dayjs from "dayjs";

export function UnitList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [unitList, setUnitList] = useState<UnitVO[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const columns: ColumnsType<UnitVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => (a.id || 0) - (b.id || 0),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: (a, b) => a.description.localeCompare(b.description),
        },
        {
            title: "Creator",
            dataIndex: "creator",
            key: "creator",
            sorter: (a, b) => a.creator - b.creator,
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            sorter: (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
        },
        {
            title: "Modifier",
            dataIndex: "modifier",
            key: "modifier",
            sorter: (a, b) => (a.modifier ?? 0) - (b.modifier ?? 0),
        },
        {
            title: "Modified",
            dataIndex: "modified",
            key: "modified",
            sorter: (a, b) => {
                if (a.modified === null && b.modified === null) return 0;
                if (a.modified === null) return -1;
                if (b.modified === null) return 1;
                return dayjs(a.modified).unix() - dayjs(b.modified).unix();
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_text: Record<string, unknown>, record: UnitVO) => (
                    <Button type="primary" href={`/units/${record.id}/edit`}><EditOutlined/></Button>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        unitAPI.findAll()
                .then((response) => {
                    setUnitList(response);
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
            <div className={"DarkDiv"} key={"unitListDiv"}>
                <Spin description={"Loading"} spinning={loading} key={"unitListSpinner"}>
                    <h1 key={"unitListHeader"}>Unit List <Link to={"/units/0/edit"}><PlusCircleFilled/></Link></h1>

                    {unitList.length > 0 && <Table
                            dataSource={unitList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={pagination}
                            key={"unitListTable"}/>}
                </Spin>
            </div>
    );
}
