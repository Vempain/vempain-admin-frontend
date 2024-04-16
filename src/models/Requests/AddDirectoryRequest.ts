export interface AddDirectoryRequest {
    source_directory: string;
    destination_directory: string;
    generate_gallery: boolean;
    gallery_shortname: string;
    gallery_description: string;
    generate_page: boolean;
    page_path: string;
    page_title: string;
    page_body: string;
    page_form_id: number;
}