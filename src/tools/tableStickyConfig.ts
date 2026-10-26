import type {TableProps} from "antd";

/** Height in pixels of the fixed top bar (`.topbar-header` in `index.css`). */
export const TOP_BAR_HEIGHT = 60;

/**
 * Sticky header configuration for the page-level list tables: while a long list is scrolled, the table header stays
 * visible, docked right below the fixed top bar. Pass it as the `sticky` prop of an Ant Design `Table` (or `VempainTable`).
 * Tables nested in expanded rows or shown inside a modal do not scroll with the page and do not use it.
 */
export const stickyTableHeader: NonNullable<TableProps["sticky"]> = {offsetHeader: TOP_BAR_HEIGHT};
