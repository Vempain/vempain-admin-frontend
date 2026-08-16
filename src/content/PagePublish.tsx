import {useParams} from "react-router-dom";
import {useEffect, useMemo, useState} from "react";
import type {FileGroupListResponse, PageResponse, PublishItemRequest} from "../models";
import {dataAPI, galleryAPI, pageAPI, siteFileAPI} from "../services";
import {Button, Divider, Space, Spin, Table} from "antd";
import {SubmitResultHandler} from "../main";
import {type EmbedDataProviders, RichTextEditor as RtEditor,} from '@vempain/vempain-rt-editor';
import TextArea from "antd/es/input/TextArea";
import dayjs, {Dayjs} from "dayjs";
import {PublishSchedule} from "./PublishSchedule";
import {ActionResult, type SubmitResult, validateParamId} from "@vempain/vempain-auth-frontend";
import type {ColumnsType} from "antd/lib/table";

const defaultDataProviders: EmbedDataProviders = {
    findGalleries: (params) => galleryAPI.findAll({details: params.details}),
    getPagedSiteFiles: (params) => siteFileAPI.getPagedSiteFiles(params),
    getAllDataSets: (params) => dataAPI.getAllDataSets(params),
};

export function PagePublish() {
    const {paramId} = useParams();
    const [loading, setLoading] = useState<boolean>(true);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [page, setPage] = useState<PageResponse | null>(null);
    const [galleryList, setGalleryList] = useState<FileGroupListResponse[]>([]);
    const [schedulePublish, setSchedulePublish] = useState<boolean>(false);
    const [publishDate, setPublishDate] = useState<Dayjs | null>(null);
    const [publishMessage, setPublishMessage] = useState<string>("");

    const mergedDataProviders = useMemo<EmbedDataProviders>(
            () => defaultDataProviders,
            [],
    );

    const galleryColumns: ColumnsType<FileGroupListResponse> = [
        {
            title: "Galleries that will be published with the page",
            dataIndex: "short_name",
            key: "title"
        },
        {title: "Description", dataIndex: "description", key: "description"},
        {
            title: "Site files",
            dataIndex: "file_count",
            key: "file_count",
            render: (fileCount: number) => fileCount
        }
    ];

    useEffect(() => {
        const tmpPageId: number = validateParamId(paramId);

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
            galleryAPI.findListByPage(tmpPageId)
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
            const selectedPublishDate: Dayjs = publishDate !== null ? publishDate : dayjs();

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
            <div className={"DarkDiv"} key={"pagePublishDiv"}>
                <Spin spinning={loading} description={"Uploading page and files..."}>
                    {page !== null && page.body !== undefined && <div>
                        <Space vertical={true} size={"large"}>
                            <RtEditor key={"pageBody"}
                                      value={page.body}
                                      readOnly={true}
                                      dataProviders={mergedDataProviders}
                            />
                            {galleryList.length > 0 && <Table key={"galleryList"}
                                                              columns={galleryColumns}
                                                              dataSource={galleryList}
                                                              pagination={false}/>}
                            <Divider orientation={"horizontal"}>Publish message</Divider>
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
