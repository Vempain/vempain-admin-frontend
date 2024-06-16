import {Button, Flex, Layout, Menu, MenuProps} from "antd";
import React, {useState} from "react";
import {
    AppstoreOutlined,
    AudioOutlined,
    ClockCircleOutlined,
    ContainerOutlined,
    FieldTimeOutlined,
    FileImageOutlined,
    FileOutlined,
    FileTextOutlined,
    FileUnknownOutlined,
    FormOutlined,
    ImportOutlined,
    InfoCircleOutlined,
    LogoutOutlined,
    PictureOutlined,
    SettingFilled,
    SnippetsOutlined,
    SwapOutlined,
    UploadOutlined,
    UserAddOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import {useSession} from "../session";
import {Link} from "react-router-dom";

const {Header} = Layout;

function TopBar() {
    const [current, setCurrent] = useState("mail");
    const {userSession} = useSession();

    const mainMenuItems: MenuProps["items"] = [
        {
            label: "Content Management",
            key: "pageManagement",
            icon: <SnippetsOutlined/>,
            children: [
                {
                    label: (<Link to={"/layouts"}>Layout</Link>),
                    key: "layout",
                    icon: <FormOutlined/>
                },
                {
                    label: (<Link to={"/components"}>Component</Link>),
                    key: "component",
                    icon: <AppstoreOutlined/>
                },
                {
                    label: (<Link to={"/forms"}>Form</Link>),
                    key: "form",
                    icon: <ContainerOutlined/>
                },
                {
                    label: (<Link to={"/pages"}>Page</Link>),
                    key: "page",
                    icon: <FileTextOutlined/>
                }
            ]
        },
        {
            label: "File Management",
            key: "fileManagement",
            icon: <FileOutlined/>,
            children: [
                {
                    label: (<Link to={"/audios"}>Audio</Link>),
                    key: "audio",
                    icon: <AudioOutlined/>
                },
                {
                    label: (<Link to={"/documents"}>Document</Link>),
                    key: "document",
                    icon: <FileUnknownOutlined/>
                },
                {
                    label: (<Link to={"/images"}>Image</Link>),
                    key: "image",
                    icon: <FileImageOutlined/>
                },
                {
                    label: (<Link to={"/videos"}>Video</Link>),
                    key: "video",
                    icon: <VideoCameraOutlined/>
                },
                {
                    label: (<Link to={"/galleries"}>Gallery</Link>),
                    key: "gallery",
                    icon: <PictureOutlined/>
                },
                {
                    label: (<Link to={"/import"}>File import</Link>),
                    key: "import",
                    icon: <ImportOutlined/>
                },
            ],
        },
        {
            label: "Schedule Management",
            key: "scheduleManagement",
            icon: <ClockCircleOutlined/>,
            children: [
                {
                    label: (<Link to={"/schedule/system"}>System schedules</Link>),
                    key: "systemSchedules",
                    icon: <AppstoreOutlined/>
                },
                {
                    label: (<Link to={"/schedule/file-imports"}>File imports</Link>),
                    key: "fileImports",
                    icon: <UploadOutlined/>
                },
                {
                    label: (<Link to={"/schedule/publishing"}>Publishing</Link>),
                    key: "publishing",
                    icon: <FieldTimeOutlined/>
                },
            ],
        },
        {
            label: "User Management",
            key: "userManagement",
            icon: <UserOutlined/>,
            children: [
                {
                    label: (<Link to={"/users"}>Users</Link>),
                    key: "users",
                    icon: <UserAddOutlined/>
                },
                {
                    label: (<Link to={"/units"}>Units</Link>),
                    key: "units",
                    icon: <UsergroupAddOutlined/>
                },
            ],
        },
    ];

    const userMenuItems: MenuProps["items"] = [
        {
            label: "Profile",
            key: "profile",
            icon: <InfoCircleOutlined/>,
            children: [
                {
                    label: "Account",
                    key: "account",
                    icon: <SettingFilled/>
                },
                {
                    label: "Change Password",
                    key: "changePassword",
                    icon: <SwapOutlined/>
                },
                {
                    label: (<Link to={"/logout"}>Log out</Link>),
                    key: "logout",
                    icon: <LogoutOutlined/>
                }
            ]
        }
    ];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
            <Header style={{display: "flex", alignItems: "center"}} key={"topBarHeader"}>
                <div className="demo-logo" key={"mainBarLogoDiv"}>
                    <Link to={"/"} key={"topBarHomeLink"}>Home</Link>
                </div>
                {userSession && <Flex gap={"middle"} vertical={false}>
                    <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={mainMenuItems} key={"mainMenu"}/>
                </Flex>}
                <div style={{marginLeft: "auto"}} key={"userMenuDiv"}>
                    {userSession ? (
                            <Menu mode={"horizontal"} items={userMenuItems} key={"userMenu"}/>
                    ) : (
                            <Button type={"text"} href={"/login"} key={"loginButton"}>
                                Login
                            </Button>
                    )}
                </div>
            </Header>
    );
}

export { TopBar };
