import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {validateParamId} from "../tools";
import type {GalleryVO, PublishItemRequest} from "../models";
import {type PageVO, QueryDetailEnum} from "../models";
import {galleryAPI, pageAPI} from "../services";
import {Button, Divider, Space, Spin, Table} from "antd";
import {SubmitResultHandler} from "../main";
import TextArea from "antd/es/input/TextArea";
import dayjs, {Dayjs} from "dayjs";
import {PublishSchedule} from "./PublishSchedule";
import {ActionResult, type SubmitResult} from "@vempain/vempain-auth-frontend";

export function PagePublish() {
    const {paramId} = useParams();
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [page, setPage] = useState<PageVO | null>(null);
    const [galleryList, setGalleryList] = useState<GalleryVO[]>([]);
    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<Dayjs | null>(null);
    const [publishMessage, setPublishMessage] = useState<string>("");

    const galleryColumns = [
        {
            title: "Galleries that will be published with the page",
            dataIndex: "short_name",
            key: "title"
        },
        {title: "Description", dataIndex: "description", key: "description"},
        {
            title: "Files",
            dataIndex: "common_files",
            key: "common_files",
            render: (files: number[]) => files.length
        }
    ];

    useEffect(() => {
        let tmpPageId: number = validateParamId(paramId);

        if (tmpPageId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setLoading(true);
        Promise.all([
            pageAPI.findById(tmpPageId, null),
            galleryAPI.findAllByPage({details: QueryDetailEnum.MINIMAL}, tmpPageId)
        ])
                .then((responses) => {
                    setPage(responses[0]);
                    setGalleryList(responses[1]);
                })
                .catch((error) => {
                    console.error("Error fetching page details or list of galleries:", error);
                    setLoadResults({status: ActionResult.FAIL, message: "Failed to fetch the page details, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [paramId]);

    function publishPage() {
        if (page !== null) {
            setLoading(true);
            const selectedPublishDate: Date = publishDate !== null ? publishDate.toDate() : dayjs().toDate();

            const publishRequest: PublishItemRequest = {
                id: page.id,
                publish_message: publishMessage,
                publish_schedule: schedulePublish,
                publish_date_time: schedulePublish ? selectedPublishDate : null,
            };

            pageAPI.publish(publishRequest)
                    .then(() => {
                        setSubmitResults({status: ActionResult.OK, message: "Page publishing completed"});
                    })
                    .catch((error) => {
                        console.error("Error publishing page:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to publish the page, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/pages"} failTo={"/pages"}/>);
    }

    return (
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading} tip={"Uploading page and files..."}>
                    {page !== null && page.body !== undefined && <div>
                        <Space direction={"vertical"} size={"large"}>
                            <TextArea key={"pageBody"}
                                      value={page.body}
                                      style={{width: 800, height: "100%"}}
                                      autoSize={true}
                            />
                            {galleryList.length > 0 && <Table key={"galleryList"}
                                                              columns={galleryColumns}
                                                              dataSource={galleryList}
                                                              pagination={false}/>}
                            <Divider orientation={"left"}>Publish message</Divider>
                            <TextArea key={"publishMessage"} onChange={(event) => {
                                setPublishMessage(event.target.value);
                            }}/>
                            <PublishSchedule setSchedulePublish={setSchedulePublish} setPublishDate={setPublishDate}/>
                            <Button key={"publishButton"} type={"primary"} onClick={publishPage}>Publish page</Button>
                        </Space>
                    </div>}
                </Spin>
            </div>
    );
}
