export interface DirectoryNodeResponse {
    directory_name: string;
    children: DirectoryNodeResponse[];
}