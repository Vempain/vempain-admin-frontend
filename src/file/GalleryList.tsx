import { useEffect, useState } from "react";
import { useSession } from "../session";
import { GalleryVO } from "../models/Responses/Files";
import { galleryAPI } from "../services/Files";
import { ColumnsType } from "antd/lib/table";
import { Button, Space, Spin, Table } from "antd";
import { aclTool } from "../tools";
import { PrivilegeEnum, QueryDetailEnum } from "../models";
import { Link } from "react-router-dom";
import { PlusCircleFilled } from "@ant-design/icons";

export function GalleryList() {
    const [loading, setLoading] = useState<boolean>(false);
    const [galleryList, setGalleryList] = useState<GalleryVO[]>([]);
    const {userSession} = useSession();

    const columns: ColumnsType<GalleryVO> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id
        },
        {
            title: 'Name',
            dataIndex: 'short_name',
            key: 'short_name',
            sorter: (a, b) => a.short_name.localeCompare(b.short_name)
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => a.description.localeCompare(b.description)
        },
        {
            title: 'File count',
            dataIndex: 'common_files',
            key: 'fileCount',
            sorter: (a, b) => a.common_files.length - b.common_files.length,
            render: (_, record: GalleryVO) => {
                return (<div key={record.id + "-file-count"}>{record.common_files.length}</div>);
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (text: any, record: GalleryVO) => (
                    <Space key={record.id + "-button-space"}>
                        <Button type="primary"
                                key={record.id + "-edit-button"}
                                href={`/galleries/${record.id}/edit`}
                        >Edit</Button>
                        {aclTool.hasPrivilege(PrivilegeEnum.DELETE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={'primary'}
                                        danger
                                        key={record.id + "-delete-button"}
                                        href={`/galleries/${record.id}/delete`}
                                >Delete</Button>}
                        {aclTool.hasPrivilege(PrivilegeEnum.CREATE, userSession?.id, userSession?.units, record.acls) &&
                                <Button type={'primary'}
                                        style={{background: "green"}}
                                        key={record.id + "-publish-button"}
                                        href={`/galleries/${record.id}/publish`}
                                >Publish</Button>}
                    </Space>
            ),
        }
    ];

    useEffect(() => {
        setLoading(true);
        galleryAPI.findAll({details: QueryDetailEnum.MINIMAL})
                .then((response) => {
                    setGalleryList(response);
                })
                .catch((error) => {
                    console.error(error);

                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function publishAll(): void {
        const publishAll = window.confirm("Are you sure you want to publish all " + galleryList.length + " galleries?");

        if (!publishAll) {
            return;
        }

        galleryAPI.publishAll()
                .then(() => {
                    setLoading(true);
                    galleryAPI.findAll()
                            .then((response) => {
                                setGalleryList(response);
                            })
                            .catch((error) => {
                                console.error("Error fetching gallery list:", error);
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                });
    }

    return (
            <div className={'darkBody'} key={'galleryListDiv'}>
                <Spin tip={'Loading'} spinning={loading} key={'galleryListSpinner'}>
                    <Space direction={'vertical'} size={'large'} key={'pageListSpace'}>
                        <h1 key={'pageListHeader'}>Gallery List <Link to={'/galleries/0/edit'}><PlusCircleFilled/></Link></h1>
                        <Button type={'primary'} onClick={publishAll}>Publish all galleries</Button>
                        <Table
                                dataSource={galleryList}
                                columns={columns}
                                key={'galleryListTable'}
                                pagination={{
                                    defaultPageSize: 5,
                                    hideOnSinglePage: true,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    total: galleryList.length,
                                    pageSizeOptions: ['5', '10', '20', '30', '50', '100']
                                }}
                        />
                    </Space>
                </Spin>
            </div>
    );
}