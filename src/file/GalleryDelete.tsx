import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { formatDateTimeWithMs, validateParamId } from "../tools";
import { ActionResult, SubmitResult } from "../models";
import { SubmitResultHandler } from "../main";
import { galleryAPI } from "../services/Files";
import { GalleryVO } from "../models/Responses/Files";
import { Button, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import CommonFileVO from "../models/Responses/Files/CommonFileVO";

export function GalleryDelete() {
    const {paramId} = useParams();
    const [galleryId, setGalleryId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [gallery, setGallery] = useState<GalleryVO | null>(null);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});

    // For the list of images
    const [commonFileList, setCommonFileList] = useState<CommonFileVO[]>([]);
    const commonFileColumns: ColumnsType<CommonFileVO> = [
        {
            title: "Creator",
            dataIndex: 'common.creator',
            key: 'creator',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{record.creator}</>);
            }
        },
        {
            title: "Created",
            dataIndex: 'common.created',
            key: 'created',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.created)}</>);
            }
        },
        {
            title: "Source file",
            dataIndex: 'common.converted_file',
            key: 'app_file',
            render: (_, record) => {
                return (<>{record.converted_file}</>);
            }
        },

    ];


    useEffect(() => {
        let tmpGalleryId: number = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: 'Called with invalid parameter'
            });
            return;
        }

        setGalleryId(tmpGalleryId);

        if (tmpGalleryId > 0) {
            setLoading(true);
            galleryAPI.findById(tmpGalleryId, null)
                    .then((galleryResponse) => {
                        setGallery(galleryResponse);
                        setCommonFileList(galleryResponse.common_files);
                    })
                    .catch((error) => {
                        console.error("Error fetching gallery details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: 'Failed to fetch the gallery details, try again later'});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }, [paramId]);

    function deletePage() {
        if (gallery !== null) {
            galleryAPI.delete(galleryId)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: 'Gallery deleted successfully'});
                    })
                    .catch((error) => {
                        console.error("Error deleting gallery:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: 'Failed to delete the gallery, try again later'});
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={'/galleries'} failTo={'/galleries'}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={'/galleries'} failTo={'/galleries'}/>);
    }

    return (
            <div className={'darkBody'} key={'galleryDeleteDiv'}>
                <Spin spinning={loading}>
                    {!loading && <div>
                        <div>
                            <h3>List of files associated with the gallery</h3>

                            {commonFileList.length > 0 && <Table
                                    dataSource={commonFileList.map((item, index) => ({...item, key: `row_${index}`}))}
                                    columns={commonFileColumns}
                            />}
                        </div>
                        <div>
                            <Button type={'primary'} danger={true} onClick={deletePage} key={'deleteButton'}>Delete gallery</Button>
                        </div>
                    </div>}
                </Spin>
            </div>
    );
}