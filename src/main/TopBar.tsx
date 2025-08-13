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
    FormOutlined,
    ImportOutlined,
    InfoCircleOutlined,
    LogoutOutlined,
    MenuOutlined,
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
import {Link, NavLink} from "react-router-dom";

const {Header} = Layout;
const {useBreakpoint} = Grid;

function TopBar() {
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
        }] || []),
        ...(userSession &&
                [
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
                {/* Logo + (desktop) menu */}
                <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            overflow: "hidden"
                        }}
                >
                    <Tooltip title={"organizationName"}>
                        <div style={{width: 156, height: 64, marginRight: 20}}>
                            <NavLink to={"/"}>
                                Some Logo
                            </NavLink>
                        </div>
                    </Tooltip>

                    {/* show horizontal Menu only on ≥ md */}
                    {screens.md && (
                            <Menu
                                    onClick={onClick}
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={menuBarItems}
                                    style={{width: "100%"}}
                            />
                    )}
                </div>

                {/* Hamburger button – hidden on desktop */}
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

export {TopBar};
