/** A tag that is removed from everything published to the website (`/admin-management/tag-blacklist`) */
export interface TagBlacklistResponse {
    id: number;
    tag_name: string;
    created_by: number;
    created: string;
}
