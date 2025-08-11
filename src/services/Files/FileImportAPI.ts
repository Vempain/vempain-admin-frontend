import type {AddDirectoryRequest, GalleryVO, ImportResponseVO, StringListVO} from "../../models";
import {AbstractAPI} from "../AbstractAPI";

class FileImportAPI extends AbstractAPI<GalleryVO, GalleryVO> {
    public async importDirectory(
        sourceDir: string,
        destinationDir: string,
        createGallery: boolean,
        galleryShortName: string,
        galleryDescription: string,
        createPage: boolean,
        pagePath: string,
        pageTitle: string,
        pageDescription: string,
        pageFormId: number,
        schedule: boolean
    ): Promise<ImportResponseVO> {
        const request: AddDirectoryRequest = {
            source_directory: sourceDir,
            destination_directory: destinationDir,
            generate_gallery: createGallery,
            gallery_shortname: galleryShortName,
            gallery_description: galleryDescription,
            generate_page: createPage,
            page_path: pagePath,
            page_title: pageTitle,
            page_body: pageDescription,
            page_form_id: pageFormId,
            schedule: schedule
        };

        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        console.log("Sending data request:");
        console.log(request);
        const response = await this.axiosInstance.post<ImportResponseVO>("/add-directory", request);
        return response.data;
    }

    public async uploadFiles(
        fileList: File[],
        destinationDir: string,
        galleryShortName: string,
        galleryDescription: string
    ): Promise<ImportResponseVO> {
        const formData = new FormData();

        for (let i = 0; i < fileList.length; i++) {
            formData.append("file_list", fileList[i]);
        }

        formData.append("destination_directory", destinationDir);

        if (galleryShortName.length > 0 && galleryDescription.length > 0) {
            formData.append("gallery_shortname", galleryShortName);
            formData.append("gallery_description", galleryDescription);
        }

        console.log("Sending form data:");
        console.log(formData);
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<ImportResponseVO>("/upload", formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    }

    public async getImportDirMatch(pathMatch: string): Promise<StringListVO> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        console.log("Match pattern: " + pathMatch);
        const response = await this.axiosInstance.get<StringListVO>("/import-directory?path=" + pathMatch);

        return response.data;
    }
}

export const fileImportAPI = new FileImportAPI("/content-management/file");
