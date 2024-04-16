import { useEffect, useState } from "react";
import { Button, Space, Spin, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";
import { QueryDetailEnum } from "../models";
import { PageVO } from "../models/Responses";
import { pageAPI } from "../services";

// Define an hash containing the spin messages
const spinMessages: Record<string, string> = {
    loading: "Loading page list...",
    publishing: "Publishing all pages..."
};

export function PageList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [pageList, setPageList] = useState<PageVO[]>([]);
    const [spinMessage, setSpinMessage] = useState<string>(spinMessages.loading);

    const columns: ColumnsType<PageVO> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id
        },
        {
            title: 'Parent ID',
            dataIndex: 'parent_id',
            key: 'parent_id',
            sorter: (a, b) => a.parent_id - b.parent_id
        },
        {
            title: 'Form ID',
            dataIndex: 'form_id',
            key: 'form_id',
            sorter: (a, b) => a.form_id - b.form_id
        },
        {
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            sorter: (a, b) => a.path.localeCompare(b.path)
        },
        {
            title: 'Secure',
            dataIndex: 'secure',
            key: 'secure',
            sorter: (a, b) => Number(b.secure) - Number(a.secure)
        },
        {
            title: 'Index List',
            dataIndex: 'index_list',
            key: 'index_list',
            sorter: (a, b) => Number(b.index_list) - Number(a.index_list)
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title)
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
            title: 'Published',
            dataIndex: 'published',
            key: 'published',
            sorter: (a, b) => {
                if (a.published === null && b.published === null) {
                    return 0;
                }

                if (a.published === null) {
                    return -1;
                }

                if (b.published === null) {
                    return 1;
                }

                return (new Date(a.published).getTime() - new Date(b.published).getTime());
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (text: any, record: PageVO) => (
                    <Space>
                        <Button type="primary" href={`/pages/${record.id}/edit`}>Edit</Button>
                        <Button type={"primary"} danger href={`/pages/${record.id}/delete`}>Delete</Button>
                        <Button type={"primary"} style={{background: "green"}} href={`/pages/${record.id}/publish`}>Publish</Button>
                    </Space>
            ),
        },
    ];

    useEffect(() => {
        setSpinMessage(spinMessages.loading);
        setLoading(true);

        pageAPI.findAll({details: QueryDetailEnum.UNPOPULATED})
                .then((response) => {
                    setPageList(response);
                    setLoading(false);
                });
    }, []);

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + pageList.length + " pages?");

        if (!publishAll) {
            return;
        }

        setSpinMessage(spinMessages.publishing);
        setLoading(true);

        pageAPI.publishAll()
                .then(() => {
                    setLoading(true);
                    pageAPI.findAll()
                            .then((response) => {
                                // This actually responds with: {"result":"OK","message":"Successfully published all pages","timestamp":"2024-04-02T20:02:01.247530395Z"}
                                // TODO Handle the response
                                setPageList(response);
                            })
                            .catch((error) => {
                                console.error("Error fetching page list:", error);
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                });
    }

    return (
            <div className={'darkBody'} key={'pageListDiv'}>
                <Spin tip={spinMessage} spinning={loading} key={"pageListSpinner"}>
                    <Space direction={'vertical'} size={'large'} key={'pageListSpace'}>
                        <h1 key={'pageListHeader'}>Page List <Link to={'/pages/0/edit'}><PlusCircleFilled/></Link></h1>
                        <Button type={'primary'} onClick={publishAll}>Publish all pages</Button>
                        <Table
                                dataSource={pageList.map((item, index) => ({...item, key: `row_${index}`}))}
                                columns={columns}
                                pagination={{
                                    defaultPageSize: 5,
                                    hideOnSinglePage: true,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    total: pageList.length,
                                    pageSizeOptions: ['5', '10', '20', '30', '50', '100']
                                }}
                                key={'pageListTable'}/>
                    </Space>
                </Spin>
            </div>
    );
}
