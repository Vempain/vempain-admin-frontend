import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {formatDateTimeWithMs} from "../tools";
import type {SiteFileResponse} from "../models";
import {type GalleryVO} from "../models";
import {SubmitResultHandler} from "../main";
import {galleryAPI} from "../services";
import {Button, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";

export function GalleryDelete() {
    const {paramId} = useParams();
    const [galleryId, setGalleryId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [gallery, setGallery] = useState<GalleryVO | null>(null);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    // For the list of images
    const [commonFileList, setCommonFileList] = useState<SiteFileResponse[]>([]);
    const siteFileColumns: ColumnsType<SiteFileResponse> = [
        {
            title: "Creator",
            dataIndex: "common.creator",
            key: "creator",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{record.creator}</>);
            }
        },
        {
            title: "Created",
            dataIndex: "common.created",
            key: "created",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.created)}</>);
            }
        },
        {
            title: "File name",
            dataIndex: "common.file_name",
            key: "app_file",
            render: (_, record) => {
                return (<>{record.file_name}</>);
            }
        },

    ];


    useEffect(() => {
        let tmpGalleryId: number = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setGalleryId(tmpGalleryId);

        if (tmpGalleryId > 0) {
            setLoading(true);
            galleryAPI.findById(tmpGalleryId, null)
                    .then((galleryResponse) => {
                        setGallery(galleryResponse);
                        setCommonFileList(galleryResponse.site_files);
                    })
                    .catch((error) => {
                        console.error("Error fetching gallery details:", error);
                        setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch the gallery details, try again later"});
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
                        setSubmitResults({status: ActionResult.OK, message: "Gallery deleted successfully"});
                    })
                    .catch((error) => {
                        console.error("Error deleting gallery:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to delete the gallery, try again later"});
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/galleries"} failTo={"/galleries"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/galleries"} failTo={"/galleries"}/>);
    }

    return (
            <div className={"DarkDiv"} key={"galleryDeleteDiv"}>
                <Spin spinning={loading}>
                    {!loading && <div>
                        <div>
                            <h3>List of files associated with the gallery</h3>

                            {commonFileList.length > 0 && <Table
                                    dataSource={commonFileList.map((item, index) => ({...item, key: `row_${index}`}))}
                                    columns={siteFileColumns}
                            />}
                        </div>
                        <div>
                            <Button type={"primary"} danger={true} onClick={deletePage} key={"deleteButton"}>Delete gallery</Button>
                        </div>
                    </div>}
                </Spin>
            </div>
    );
}