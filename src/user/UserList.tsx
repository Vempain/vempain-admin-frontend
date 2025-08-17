import {useEffect, useState} from "react";
import {Button, Spin, Table, type TablePaginationConfig} from "antd";
import type {ColumnsType} from "antd/lib/table";
import {Link} from "react-router-dom";
import {PlusCircleFilled} from "@ant-design/icons";
import {userAPI} from "../services";
import {getPaginationConfig} from "../tools";
import type {UserVO} from "@vempain/vempain-auth-frontend";

export function UserList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [userList, setUserList] = useState<UserVO[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

    const columns: ColumnsType<UserVO> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id
        },
        {
            title: "Login Name",
            dataIndex: "login_name",
            key: "login_name",
            sorter: (a, b) => a.login_name.localeCompare(b.login_name)
        },
        {
            title: "Private",
            dataIndex: "type_yes_no",
            key: "type_yes_no",
            sorter: (a, b) => Number(b.private_user) - Number(a.private_user)
        },
        {
            title: "Privacy Type",
            dataIndex: "privacy_type",
            key: "privacy_type",
            sorter: (a, b) => a.privacy_type.localeCompare(b.privacy_type)
        },
        {
            title: "Street",
            dataIndex: "street",
            key: "street",
            sorter: (a, b) => a.street.localeCompare(b.street)
        },
        {
            title: "Place of Birth",
            dataIndex: "pob",
            key: "pob",
            sorter: (a, b) => a.pob.localeCompare(b.pob)
        },
        {
            title: "Birthday",
            dataIndex: "birthday",
            key: "birthday",
            sorter: (a, b) => new Date(a.birthday).getTime() - new Date(b.birthday).getTime()
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: "Nick",
            dataIndex: "nick",
            key: "nick",
            sorter: (a, b) => a.nick.localeCompare(b.nick)
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            sorter: (a, b) => a.email.localeCompare(b.email)
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
            render: (_text: any, record: UserVO) => (
                    <Button type="primary" href={`/users/${record.id}/edit`}>Edit</Button>
            ),
        },
    ];

    useEffect(() => {
        setLoading(true);
        userAPI.findAll()
                .then((response) => {
                    setUserList(response);
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
            <div className={"DarkDiv"} key={"userListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"userListSpinner"}>
                    <h1 key={"userListHeader"}>User List <Link to={"/users/0/edit"}><PlusCircleFilled/></Link></h1>

                    {userList.length > 0 && <Table
                            dataSource={userList.map((item, index) => ({...item, key: `row_${index}`}))}
                            columns={columns}
                            pagination={pagination}
                            key={"userListTable"}/>}
                </Spin>
            </div>
    );
}
