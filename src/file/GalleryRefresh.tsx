import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {validateParamId} from "../tools";
import {type GalleryVO} from "../models";
import {fileSystemAPI, galleryAPI} from "../services";
import {SubmitResultHandler} from "../main";
import {LoadingOutlined} from "@ant-design/icons";
import {Button, Space, Spin} from "antd";
import {CommonFileCard} from "./CommonFileCard";
import {ActionResult, type SubmitResult} from "@vempain/vempain-auth-frontend";

export function GalleryRefresh() {
    const {paramId} = useParams();
    const [galleryId, setGalleryId] = useState<number>(0);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>("Loading gallery files");
    const [gallery, setGallery] = useState<GalleryVO>();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    useEffect(() => {
        setLoadingMessage("Loading gallery files");
        let tmpGalleryId: number = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setGalleryId(tmpGalleryId);
        setLoading(true);

        galleryAPI.findById(tmpGalleryId, null)
                .then((response) => {
                    setGallery(response);
                })
                .catch((error) => {
                    console.error("Error fetching gallery information:", error);
                    setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch gallery, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [paramId]);

    function refreshGalleryFiles() {
        if (gallery !== null && gallery !== undefined && gallery.id > 0) {
            setLoading(true);
            setLoadingMessage("Refreshing gallery files");

            fileSystemAPI.refreshGalleryFiles(galleryId)
                    .then((response) => {
                        if (response.result === ActionResult.OK) {
                            setSubmitResults({status: ActionResult.OK, message: "Gallery files refreshed successfully"});
                        } else {
                            const responseDetails = response.details.map((detail) => detail.result_description).join(", ");
                            setSubmitResults({status: ActionResult.FAIL, message: "Failed to refresh the gallery files, details: " + responseDetails});
                        }
                    })
                    .catch((error) => {
                        console.error("Error publishing gallery:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to publish the gallery, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
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
            <div className={"darkBody"} key={"galleryRefreshFilesDiv"}>
                <Spin spinning={loading}
                      tip={loadingMessage}
                      indicator={<LoadingOutlined style={{fontSize: 24}} spin={true}/>}
                >
                    {gallery !== null && gallery?.id !== undefined && <div>
                        <Space direction={"vertical"} size={"large"}>
                            <h4>Refreshing '{gallery.short_name}' gallery files</h4>

                            <Button key={"refreshFilesButton-top"} type={"primary"} onClick={refreshGalleryFiles}>Refresh gallery files</Button>
                            {
                                    gallery.common_files.length > 0 &&
                                    gallery.common_files.map(commonFile => {
                                        return (<CommonFileCard key={"commonFileCard-" + commonFile.id} commonFile={commonFile}/>);
                                    })
                            }
                            <Button key={"refreshFilesButton-bottom"} type={"primary"} onClick={refreshGalleryFiles}>Refresh gallery files</Button>
                        </Space>
                    </div>}
                </Spin>
            </div>
    );
}