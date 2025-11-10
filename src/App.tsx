import {ConfigProvider, Layout, theme} from "antd";
import {Navigate, Route, Routes} from "react-router-dom";
import "./App.css";
import {BottomFooter, Home, TopBar} from "./main";
import {
    ComponentDelete,
    ComponentEditor,
    ComponentList,
    FormDelete,
    FormEditor,
    FormList,
    LayoutEditor,
    LayoutList,
    PageDelete,
    PageEditor,
    PageList,
    PagePublish
} from "./content";
import {UnitEditor, UnitList, UserEditor, UserList} from "./user";
import {LayoutDelete} from "./content/LayoutDelete";
import {FileImport, GalleryDelete, GalleryEdit, GalleryList, GalleryPublish, GalleryRefresh} from "./file";
import {FileImportScheduleList, FileImportScheduleTrigger, ItemPublishingList, ItemPublishTrigger, SystemScheduleList, SystemScheduleTrigger} from "./schedule";
import {Login, Logout} from "@vempain/vempain-auth-frontend";
import {FileTypeEnum} from "./models";
import {SiteFileList} from "./file/SiteFileList.tsx";

const {Content} = Layout;

function App() {
    const {darkAlgorithm} = theme;

    return (
            <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                <Layout className={"layout"}>
                    <TopBar/>
                    <Content style={{marginTop: "65px"}}>
                        <div className={"site-layout-content"}>
                            <Routes>
                                <Route path={"*"} element={<Navigate to={"/"}/>}/>
                                <Route path={"/"} element={<Home/>}/>
                                <Route path={"/login"} element={<Login/>}/>
                                <Route path={"/logout"} element={<Logout/>}/>
                                {/* Content */}
                                <Route path={"/components"} element={<ComponentList/>}/>
                                <Route path={"/components/:paramId/delete"} element={<ComponentDelete/>}/>
                                <Route path={"/components/:paramId/edit"} element={<ComponentEditor/>}/>
                                <Route path={"/forms"} element={<FormList/>}/>
                                <Route path={"/forms/:paramId/delete"} element={<FormDelete/>}/>
                                <Route path={"/forms/:paramId/edit"} element={<FormEditor/>}/>
                                <Route path={"/layouts"} element={<LayoutList/>}/>
                                <Route path={"/layouts/:paramId/delete"} element={<LayoutDelete/>}/>
                                <Route path={"/layouts/:paramId/edit"} element={<LayoutEditor/>}/>
                                <Route path={"/pages"} element={<PageList/>}/>
                                <Route path={"/pages/:paramId/delete"} element={<PageDelete/>}/>
                                <Route path={"/pages/:paramId/edit"} element={<PageEditor/>}/>
                                <Route path={"/pages/:paramId/publish"} element={<PagePublish/>}/>
                                {/* Files */}
                                <Route path={"/archives"} element={<SiteFileList fileType={FileTypeEnum.ARCHIVE} title="Archive Files" />}/>
                                <Route path={"/audios"} element={<SiteFileList fileType={FileTypeEnum.AUDIO} title="Audio Files" />}/>
                                <Route path={"/binaries"} element={<SiteFileList fileType={FileTypeEnum.BINARY} title="Binary Files" />}/>
                                <Route path={"/data"} element={<SiteFileList fileType={FileTypeEnum.DATA} title="Data Files" />}/>
                                <Route path={"/documents"} element={<SiteFileList fileType={FileTypeEnum.DOCUMENT} title="Document Files" />}/>
                                <Route path={"/executables"} element={<SiteFileList fileType={FileTypeEnum.EXECUTABLE} title="Executable Files" />}/>
                                <Route path={"/fonts"} element={<SiteFileList fileType={FileTypeEnum.FONT} title="Font Files" />}/>
                                <Route path={"/icons"} element={<SiteFileList fileType={FileTypeEnum.ICON} title="Icon Files" />}/>
                                <Route path={"/images"} element={<SiteFileList fileType={FileTypeEnum.IMAGE} title="Image Files" />}/>
                                <Route path={"/interactives"} element={<SiteFileList fileType={FileTypeEnum.INTERACTIVE} title="Interactive Files" />}/>
                                <Route path={"/thumbs"} element={<SiteFileList fileType={FileTypeEnum.THUMB} title="Thumbnail Files" />}/>
                                <Route path={"/unknowns"} element={<SiteFileList fileType={FileTypeEnum.UNKNOWN} title="Unknown Files" />}/>
                                <Route path={"/vectors"} element={<SiteFileList fileType={FileTypeEnum.VECTOR} title="Vector Files" />}/>
                                <Route path={"/videos"} element={<SiteFileList fileType={FileTypeEnum.VIDEO} title="Video Files" />}/>
                                <Route path={"/galleries"} element={<GalleryList/>}/>
                                <Route path={"/galleries/:paramId/delete"} element={<GalleryDelete/>}/>
                                <Route path={"/galleries/:paramId/edit"} element={<GalleryEdit/>}/>
                                <Route path={"/galleries/:paramId/publish"} element={<GalleryPublish/>}/>
                                <Route path={"/galleries/:paramId/refresh"} element={<GalleryRefresh/>}/>
                                <Route path={"/import"} element={<FileImport/>}/>
                                {/* Schedules */}
                                <Route path={"/schedule/system"} element={<SystemScheduleList/>}/>
                                <Route path={"/schedule/system/:paramName/trigger"} element={<SystemScheduleTrigger/>}/>
                                <Route path={"/schedule/file-imports"} element={<FileImportScheduleList/>}/>
                                <Route path={"/schedule/file-imports/:paramId/trigger"} element={<FileImportScheduleTrigger/>}/>
                                <Route path={"/schedule/publishing"} element={<ItemPublishingList/>}/>
                                <Route path={"/schedule/publish/:paramId/trigger"} element={<ItemPublishTrigger/>}/>
                                {/* User */}
                                <Route path={"/units"} element={<UnitList/>}/>
                                <Route path={"/units/:paramId/edit"} element={<UnitEditor/>}/>
                                <Route path={"/users"} element={<UserList/>}/>
                                <Route path={"/users/:paramId/edit"} element={<UserEditor/>}/>
                            </Routes>
                        </div>
                        <BottomFooter/>
                    </Content>
                </Layout>
            </ConfigProvider>
    );
}

export default App;
