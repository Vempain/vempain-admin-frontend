/** Auto-completion of a page path: the parent path shared by every readable page whose path starts with the typed prefix */
export interface PagePathSuggestionResponse {
    prefix: string;
    suggestion: string | null;
    matches: number;
}
