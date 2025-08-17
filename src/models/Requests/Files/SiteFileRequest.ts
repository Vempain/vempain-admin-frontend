export interface SiteFileRequest {
    id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
    // Optional file class from backend (e.g. AUDIO, IMAGE, DOCUMENT, VIDEO, etc.)
    file_class?: string;

    size: number;
    sha256sum: string;
    creator: number;
    created: string;
    modifier: number | null;
    modified: string;
}