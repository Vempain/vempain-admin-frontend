/** Display names of the resource types the statistics endpoint of the admin backend reports, in its order */
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
    page: "Pages",
    gallery: "Galleries",
    site_file: "Site files",
    component: "Components",
    form: "Forms",
    layout: "Layouts",
};

/** The display name of a resource type, or the type itself when the backend reports a new one */
export function resourceTypeLabel(resourceType: string): string {
    return RESOURCE_TYPE_LABELS[resourceType] ?? resourceType;
}
