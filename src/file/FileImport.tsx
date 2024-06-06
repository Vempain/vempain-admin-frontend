import React, { useEffect, useState } from "react";
import { Button, Checkbox, Col, Form, Input, Row, Select, Spin, TreeSelect } from "antd";
import { fileImportAPI, fileSystemAPI } from "../services/Files";
import TextArea from "antd/es/input/TextArea";
import { SubmitResultHandler } from "../main";
import { ActionResult, QueryDetailEnum, SubmitResult } from "../models";
import { DirectoryNodeResponse } from "../models/Responses/Files/DirectoryNodeResponse";
import { FileImageOutlined, LoadingOutlined } from "@ant-design/icons";
import { formAPI } from "../services";

interface FileImportFormProps {
    source_directory: string;
    site_directory: string;
    create_gallery: boolean;
    create_page: boolean;
    gallery_shortname: string | undefined;
    gallery_description: string | undefined;
    page_title: string | undefined;
    page_path: string | undefined;
    page_body: string | undefined;
    page_form_id: number | undefined;
}

interface TreeNode {
    title: string;
    value: string;
    icon: JSX.Element;
    children: TreeNode[];
}

export function FileImport() {
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>("Loading directories");

    const [createGallery, setCreateGallery] = useState<boolean>(false);
    const [createPage, setCreatePage] = useState<boolean>(false);
    const [fileImportForm] = Form.useForm();
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [directoryTree, setDirectoryTree] = useState<TreeNode[]>([]);
    const [keepSiteDirSynced, setKeepSiteDirSynced] = useState<boolean>(true);
    const [formList, setFormList] = useState<{ label: string, value: number }[]>([]);

    useEffect(() => {
        setLoadingMessage("Loading directories");

        function generateTreeData(parentPath: string, node: DirectoryNodeResponse): TreeNode {
            let parentPrefix: string = "";

            if (parentPath.length > 0) {
                parentPrefix = parentPath + "/";
            }

            const treeNode: TreeNode = {
                title: node.directory_name,
                value: parentPrefix + node.directory_name,
                icon: <FileImageOutlined/>,
                children: []
            };

            if (node.children !== null && node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    treeNode.children.push(generateTreeData(parentPrefix + node.directory_name, node.children[i]));
                }
            }

            return treeNode;
        }

        setLoading(true);
        Promise.all([
            fileSystemAPI.getConvertedDirectoryTree(),
            formAPI.findAll({details: QueryDetailEnum.MINIMAL})
        ])
                .then((response) => {
                    let listOfRootDirs: TreeNode[] = [];
                    // Loop through the list received in the response
                    for (let i = 0; i < response[0].length; i++) {
                        // We only add the root directories to the list which contain children
                        if (response[0][i].children !== null && response[0][i].children.length > 0) {
                            listOfRootDirs.push(generateTreeData("", response[0][i]));
                        }
                    }

                    setDirectoryTree(listOfRootDirs);

                    let tmpFormList: { label: string, value: number }[] = [];

                    for (let i = 0; i < response[1].length; i++) {
                        tmpFormList.push({label: response[1][i].name, value: response[1][i].id});
                    }

                    setFormList(tmpFormList);
                })
                .catch((error) => {
                    console.error("Error fetching converted tree:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function onFinish(values: FileImportFormProps) {
        setLoadingMessage("Processing files");
        setLoading(true);
        const shortName = values.gallery_shortname === undefined ? "" : values.gallery_shortname;
        const description = values.gallery_description === undefined ? "" : values.gallery_description;
        const pagePath = values.page_path === undefined ? "" : values.page_path;
        const pageTitle = values.page_title === undefined ? "" : values.page_title;
        const pageBody = values.page_body === undefined ? "" : values.page_body;
        const pageFormId = values.page_form_id === undefined ? 0 : values.page_form_id;

        fileImportAPI.importDirectory(values.source_directory, values.site_directory,
                values.create_gallery, shortName, description,
                values.create_page, pagePath, pageTitle, pageBody, pageFormId)
                .then(() => {
                    console.log("Imported directory successfully");
                    setSubmitResults({status: ActionResult.OK, message: "Directory imported successfully"});
                })
                .catch((error) => {
                    console.error("Error importing directory:", error);
                    setSubmitResults({status: ActionResult.FAIL, message: "Failed to import the directory, try again later"});
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function handleFormValuesChange(something: any, allValues: FileImportFormProps) {
        const formField = Object.keys(something)[0];
        switch (formField) {
            case "site_directory":
                if (allValues.site_directory !== allValues.source_directory) {
                    setKeepSiteDirSynced(false);
                } else {
                    setKeepSiteDirSynced(true);
                }
                break;
            case "source_directory":
                if (keepSiteDirSynced) {
                    const sitePath = allValues.source_directory.substring(allValues.source_directory.indexOf("/") + 1);
                    fileImportForm.setFieldsValue({site_directory: sitePath});
                    fileImportForm.setFieldsValue({page_path: sitePath + "/index"});
                }
                break;
            case "create_gallery":
                setCreateGallery(something[formField]);
                break;
            case "create_page":
                setCreatePage(something[formField]);
                break;
            default:
                console.log("Other form field: " + formField);
        }
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/"} failTo={"/"}/>);
    }

    return (
            <div className={"darkBody"} key={"pagePublishDiv"}>
                <Spin spinning={loading}
                      tip={loadingMessage}
                      indicator={<LoadingOutlined style={{fontSize: 24}} spin={true}/>}
                >
                    {directoryTree.length > 0 &&
                            <Form
                                    form={fileImportForm}
                                    labelCol={{span: 6}}
                                    wrapperCol={{span: 18}}
                                    onFinish={onFinish}
                                    onValuesChange={handleFormValuesChange}
                            >
                                <Form.Item name={"source_directory"}
                                           label={"Select Directory"}
                                           rules={[
                                               {
                                                   required: true,
                                                   message: "Please select a directory!"
                                               }
                                           ]}>
                                    <TreeSelect
                                            treeLine={false}
                                            style={{width: 500}}
                                            treeData={directoryTree}
                                            treeIcon={true}
                                    />
                                </Form.Item>
                                <Form.Item name={"site_directory"}
                                           label={"Site Directory"}
                                           rules={[
                                               {
                                                   required: true,
                                                   message: "Please enter a site directory!"
                                               }]}
                                           tooltip={"Destination directory for the files on the site"}
                                >
                                    <Input
                                            placeholder="Site directory"
                                            style={{width: 800}}
                                    />
                                </Form.Item>
                                <Row gutter={12}>
                                    <Col span={6}>
                                    </Col>
                                    <Col span={5}>
                                        <Form.Item name="create_gallery"
                                                   valuePropName="checked"
                                        >
                                            <Checkbox>
                                                Create new gallery of uploaded files?
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                        <Form.Item name="create_page"
                                                   valuePropName="checked"
                                        >
                                            <Checkbox>
                                                Create new page of uploaded files?
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                {createGallery && (
                                        <>
                                            <Form.Item name="gallery_shortname" label="Gallery Short Name"
                                                       rules={[{required: true, message: "Please enter a short name for the gallery!"}]}>
                                                <Input placeholder="Gallery short name" style={{width: 800}}/>
                                            </Form.Item>
                                            <Form.Item name="gallery_description" label="Gallery Description">
                                                <TextArea placeholder="Gallery description"
                                                          style={{width: 800}}
                                                          autoSize={true}
                                                />
                                            </Form.Item>
                                        </>
                                )}
                                {createPage && (
                                        <>
                                            <Form.Item name="page_title" label="Page title"
                                                       rules={[{required: true, message: "Please enter a title for the gallery page!"}]}>
                                                <Input placeholder="Page title" style={{width: 800}}/>
                                            </Form.Item>
                                            <Form.Item name="page_path" label="Page Path"
                                                       rules={[{required: true, message: "Please enter a valid path for the gallery page!"}]}>
                                                <Input placeholder="Page path" style={{width: 800}}/>
                                            </Form.Item>
                                            <Form.Item name="page_body" label="Page body">
                                                <TextArea placeholder="Page body"
                                                          style={{width: 800}}
                                                          autoSize={true}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                    name="page_form_id"
                                                    label="Select a form"
                                                    rules={[{required: true, message: "Please select a form for the page!"}]}
                                            >
                                                <Select
                                                        showSearch={true}
                                                        style={{width: 800}}
                                                        placeholder="Select a form"
                                                        options={formList}/>
                                            </Form.Item>
                                        </>
                                )}
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Import
                                    </Button>
                                </Form.Item>
                            </Form>}
                </Spin>
            </div>
    );
}
