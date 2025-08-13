import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {validateParamId} from "../tools";
import {type GalleryVO, type PublishItemRequest} from "../models";
import {galleryAPI} from "../services";
import {Button, Divider, Input, Space, Spin} from "antd";
import TextArea from "antd/es/input/TextArea";
import {SubmitResultHandler} from "../main";
import {CommonFileCard} from "./CommonFileCard";
import {LoadingOutlined} from "@ant-design/icons";
import dayjs, {Dayjs} from "dayjs";
import {PublishSchedule} from "../content";
import {ActionResult, type SubmitResult} from "@vempain/vempain-auth-frontend";


export function GalleryPublish() {
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>("Loading directories");

    const {paramId} = useParams();
    const [gallery, setGallery] = useState<GalleryVO>();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<Dayjs | null>(null);
    const [publishMessage, setPublishMessage] = useState<string>("");

    useEffect(() => {
        setLoadingMessage("Loading directories");
        let tmpGalleryId: number = validateParamId(paramId);

        if (tmpGalleryId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

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

    function publishGallery() {
        if (gallery !== null && gallery !== undefined && gallery.id > 0) {
            setLoading(true);
            setLoadingMessage("Publishing gallery");
            const selectedPublishDate: Date = publishDate !== null ? publishDate.toDate() : dayjs().toDate();

            const publishRequest: PublishItemRequest = {
                id: gallery.id,
                publish_message: publishMessage,
                publish_schedule: schedulePublish,
                publish_date_time: schedulePublish ? selectedPublishDate : null,
            };

            galleryAPI.publish(publishRequest)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Gallery published successfully"});
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
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading}
                      tip={loadingMessage}
                      indicator={<LoadingOutlined style={{fontSize: 24}} spin={true}/>}
                >
                    {gallery !== null && gallery?.id !== undefined && <div>
                        <Space direction={"vertical"} size={"large"}>
                            <Input key={"galleryShortname"}
                                   value={gallery.short_name}
                                   style={{width: 800}}
                                   disabled={true}
                            />
                            <TextArea key={"galleryDescription"}
                                      value={gallery.description}
                                      style={{width: 800, height: "100%"}}
                                      disabled={true}
                                      autoSize={true}
                            />
                            <Divider orientation={"left"}>Publish message</Divider>
                            <TextArea key={"publishMessage"} onChange={(event) => {setPublishMessage(event.target.value);}}/>
                            <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate} />
                            <Button key={"publishButton-top"} type={"primary"} onClick={publishGallery}>Publish gallery</Button>
                            {
                                    gallery.common_files.length > 0 &&
                                    gallery.common_files.map(commonFile => {
                                        return (<CommonFileCard key={"commonFileCard-" + commonFile.id} commonFile={commonFile}/>);
                                    })
                            }
                            <Button key={"publishButton-bottom"} type={"primary"} onClick={publishGallery}>Publish gallery</Button>
                        </Space>
                    </div>}
                </Spin>
            </div>
    );
}