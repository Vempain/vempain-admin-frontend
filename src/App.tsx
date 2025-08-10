import {ConfigProvider, Layout, theme} from "antd";
import {Navigate, Route, Routes} from "react-router-dom";
import "./App.css";
import {BottomFooter, Home, Login, Logout, TopBar} from "./main";
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
import {AudioList, DocumentList, FileImport, GalleryDelete, GalleryEdit, GalleryList, GalleryPublish, GalleryRefresh, ImageList, VideoList} from "./file";
import {FileImportScheduleList, FileImportScheduleTrigger, ItemPublishingList, ItemPublishTrigger, SystemScheduleList, SystemScheduleTrigger} from "./schedule";

const {Content, Footer} = Layout;

function App() {
    const {darkAlgorithm} = theme;

    return (
            <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                <Layout className={"layout"}>
                    <TopBar/>
                    <Content style={{padding: "0 50px", marginTop: '42px'}}>
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
                                <Route path={"/audios"} element={<AudioList/>}/>
                                <Route path={"/documents"} element={<DocumentList/>}/>
                                <Route path={"/galleries"} element={<GalleryList/>}/>
                                <Route path={"/galleries/:paramId/delete"} element={<GalleryDelete/>}/>
                                <Route path={"/galleries/:paramId/edit"} element={<GalleryEdit/>}/>
                                <Route path={"/galleries/:paramId/publish"} element={<GalleryPublish/>}/>
                                <Route path={"/galleries/:paramId/refresh"} element={<GalleryRefresh/>}/>
                                <Route path={"/images"} element={<ImageList/>}/>
                                <Route path={"/import"} element={<FileImport/>}/>
                                <Route path={"/videos"} element={<VideoList/>}/>
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
