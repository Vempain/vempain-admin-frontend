import {Button, Drawer, Grid, Layout, Menu, type MenuProps, Tooltip} from "antd";
import {useState} from "react";
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
    FileWordOutlined,
    FileZipOutlined,
    FontSizeOutlined,
    FormOutlined,
    ForwardOutlined,
    ImportOutlined,
    InfoCircleOutlined,
    LogoutOutlined,
    MenuOutlined,
    PictureOutlined,
    RetweetOutlined,
    SettingFilled,
    SnippetsOutlined,
    SwapOutlined,
    UploadOutlined,
    UserAddOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    VideoCameraAddOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import {Link, NavLink} from "react-router-dom";
import {useSession} from "@vempain/vempain-auth-frontend";

const {Header} = Layout;
const {useBreakpoint} = Grid;

export function TopBar() {
    const [current, setCurrent] = useState("mail");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const {userSession} = useSession();
    type MenuItem = Required<MenuProps>["items"][number];
    const screens = useBreakpoint();

    const menuBarItems: MenuItem[] = [
        ...(userSession && [{
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
                        label: (<Link to={"/archives"}>Archive</Link>),
                        key: "archive",
                        icon: <FileZipOutlined/>
                    },
                    {
                        label: (<Link to={"/audios"}>Audio</Link>),
                        key: "audio",
                        icon: <AudioOutlined/>
                    },
                    {
                        label: (<Link to={"/binaries"}>Binary</Link>),
                        key: "binary",
                        icon: <FileUnknownOutlined/>
                    },
                    {
                        label: (<Link to={"/data"}>Data</Link>),
                        key: "data",
                        icon: <FileTextOutlined/>
                    },
                    {
                        label: (<Link to={"/documents"}>Document</Link>),
                        key: "document",
                        icon: <FileWordOutlined/>
                    },
                    {
                        label: (<Link to={"/executables"}>Executable</Link>),
                        key: "executable",
                        icon: <ForwardOutlined/>
                    },
                    {
                        label: (<Link to={"/fonts"}>Font</Link>),
                        key: "font",
                        icon: <FontSizeOutlined/>
                    },
                    {
                        label: (<Link to={"/icons"}>Icon</Link>),
                        key: "icon",
                        icon: <RetweetOutlined/>
                    },
                    {
                        label: (<Link to={"/images"}>Image</Link>),
                        key: "image",
                        icon: <FileImageOutlined/>
                    },
                    {
                        label: (<Link to={"/interactives"}>Interactive</Link>),
                        key: "interactive",
                        icon: <VideoCameraAddOutlined/>
                    },
                    {
                        label: (<Link to={"/thumbs"}>Thumbnail</Link>),
                        key: "thumb",
                        icon: <FileImageOutlined />
                    },
                    {
                        label: (<Link to={"/unknowns"}>Unknown</Link>),
                        key: "unknown",
                        icon: <FileUnknownOutlined />
                    },
                    {
                        label: (<Link to={"/vectors"}>Vector</Link>),
                        key: "vector",
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
                label: "Web Site Management",
                key: "webSiteManagement",
                icon: <UserOutlined/>,
                children: [
                    {
                        label: (<Link to={"/administration/web-site-configuration"}>Web site configuration</Link>),
                        key: "users",
                        icon: <UserAddOutlined/>
                    },
                    {
                        label: (<Link to={"/administration/web-users"}>Web users</Link>),
                        key: "web-users",
                        icon: <UsergroupAddOutlined/>
                    }
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
                    }
                ],
            }] || []),
        ...(userSession &&
                [
                    {
                        label: "Profile (" + userSession.nickname + ")",
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
                ] || [
                    {
                        label: (<Link to={"/login"}>Login</Link>),
                        key: "login",
                        icon: <UserOutlined/>
                    }
                ])
    ];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
            <Header
                    className="topbar-header"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        backgroundColor: "#191919",
                        maxWidth: "100%"
                    }}
                    key={"topBarHeader"}
            >
                <div style={{display: "flex", alignItems: "center", flex: 1, overflow: "hidden"}}>
                    <Tooltip title={"Vempain Admin"}>
                        <div style={{width: 60, height: 60, marginRight: 20}}>
                            <NavLink to={"/"}>
                                <img src="/logo192.png" alt="Home" style={{height: "55px", objectFit: "contain"}}/>
                            </NavLink>
                        </div>
                    </Tooltip>

                    {screens.md && (
                            <Menu
                                    className="topbar-menu"
                                    onClick={onClick}
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={menuBarItems}
                                    style={{width: "100%"}}
                            />
                    )}
                </div>

                {!screens.md && (
                        <>
                            <Button
                                    type="text"
                                    icon={<MenuOutlined style={{fontSize: 24}}/>}
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label="Open menu"
                            />
                            <Drawer
                                    placement="right"
                                    onClose={() => setDrawerOpen(false)}
                                    open={drawerOpen}
                                    styles={{body: {padding: "0"}}}
                                    width={260}
                            >
                                <Menu
                                        onClick={onClick}
                                        selectedKeys={[current]}
                                        mode="inline"
                                        items={menuBarItems}
                                        style={{border: "none"}}
                                />
                            </Drawer>
                        </>
                )}
            </Header>
    );
}