/* eslint-disable react-refresh/only-export-components -- Jest manual mock, not an application module */
/**
 * Manual Jest mock of @vempain/vempain-common-frontend (the package ships an ESM build that the CommonJS test runtime cannot load,
 * like @vempain/vempain-auth-frontend). The models are real; the task API client, provider, tray and hook are inert stand-ins.
 * Tests that need to assert on task tracking spy on `trackTaskMock` or provide their own jest.mock factory.
 */
import {type ReactNode, useState} from "react";
import axios from "axios";
import {message} from "antd";

export const TaskStatusEnum = {
    QUEUED: 'QUEUED' as const,
    RUNNING: 'RUNNING' as const,
    CANCELLING: 'CANCELLING' as const,
    CANCELLED: 'CANCELLED' as const,
    COMPLETED: 'COMPLETED' as const,
    FAILED: 'FAILED' as const
};
export type TaskStatusEnum = typeof TaskStatusEnum[keyof typeof TaskStatusEnum];

export function isTaskFinished(status: TaskStatusEnum): boolean {
    return status === TaskStatusEnum.COMPLETED || status === TaskStatusEnum.FAILED || status === TaskStatusEnum.CANCELLED;
}

export function isTaskCancellable(status: TaskStatusEnum): boolean {
    return status === TaskStatusEnum.QUEUED || status === TaskStatusEnum.RUNNING;
}

export interface TaskAcceptedResponse {
    task_id: string;
    type: string;
    title: string;
    status: TaskStatusEnum;
    total_steps: number;
}

export interface TaskProgressResponse<R = unknown> {
    task_id: string;
    type: string;
    title: string;
    status: TaskStatusEnum;
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    percent: number;
    cancel_requested: boolean;
    reverted_steps: number;
    message: string | null;
    error_message: string | null;
    result: R | null;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
}

export const TASK_POLL_INTERVAL_MS = 1500;
export const CLOSED_TASKS_STORAGE_KEY = "vempain.tasks.closed";

export class TaskAPI {
    readonly baseURL: string;
    readonly member: string;

    constructor(baseURL: string, member: string) {
        this.baseURL = baseURL;
        this.member = member;
    }

    getTasks = jest.fn(async (): Promise<TaskProgressResponse[]> => []);
    getTask = jest.fn();
    cancelTask = jest.fn();
    dismissTask = jest.fn();
}

export const ApiTokenScope = {
    FILE_SERVICE: "FILE_SERVICE",
    MCP_READ: "MCP_READ"
} as const;

export const ApiTokenNetworkSource = {
    CONFIGURED: "CONFIGURED",
    PRIVATE_NETWORK: "PRIVATE_NETWORK",
    NONE: "NONE"
} as const;

export class ApiTokenAPI {
    readonly baseURL: string;
    readonly member: string;
    private readonly axiosInstance: ReturnType<typeof axios.create>;

    constructor(baseURL: string, member: string) {
        this.baseURL = baseURL;
        this.member = member;
        this.axiosInstance = axios.create({baseURL: `${baseURL}${member}`});
    }

    async list() {
        return (await this.axiosInstance.get("", {params: undefined})).data;
    }

    async defaultNetwork() {
        return (await this.axiosInstance.get("/default-network")).data;
    }

    async createToken(request: unknown) {
        return (await this.axiosInstance.post("", request)).data;
    }

    async deleteToken(id: number) {
        await this.axiosInstance.delete(`/${id}`);
    }
}

export function isValidNetwork(value: string | undefined): boolean {
    if (!value) return false;
    const text = value.trim();
    return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(\/([0-9]|[12]\d|3[0-2]))?$/.test(text)
            || /^[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*(\/(\d|[1-9]\d|1[01]\d|12[0-8]))?$/.test(text);
}

interface MockToken {
    id: number;
    token_prefix: string;
    description: string;
    scope: MockTokenScope;
    network: string;
    expires_at: string;
    owner_user_id: number;
    created: string;
    last_used: string | null;
    expired: boolean;
}

interface MockNetworkResponse {
    network: string | null;
    source: typeof ApiTokenNetworkSource[keyof typeof ApiTokenNetworkSource];
    candidates: { network: string; interface_name: string; address: string }[];
}

interface MockCreatedResponse {
    token: string;
    api_token: MockToken;
}

type MockTokenScope = typeof ApiTokenScope[keyof typeof ApiTokenScope];

interface MockTokenAPI {
    list: () => Promise<MockToken[]>;
    defaultNetwork: () => Promise<MockNetworkResponse>;
    createToken: (request: { description: string; network: string; expires_at: string; scope?: MockTokenScope }) => Promise<MockCreatedResponse>;
    deleteToken: (id: number) => Promise<void>;
}

export function ApiTokenManagement(props: {
    api: MockTokenAPI;
    scopeOptions: { value: MockTokenScope; label: string }[];
    defaultScope?: MockTokenScope;
    descriptionPlaceholder: string;
    creationTitle: string;
    description: string;
    networkHint: (suggestion: MockNetworkResponse | null) => string;
    createdTokenDescription: (token: MockToken) => string;
}) {
    const [tokens, setTokens] = useState<MockToken[]>([]);
    const [creating, setCreating] = useState(false);
    const [suggestion, setSuggestion] = useState<MockNetworkResponse | null>(null);
    const [created, setCreated] = useState<MockCreatedResponse | null>(null);
    const [description, setDescription] = useState("");
    const [network, setNetwork] = useState("");
    const [scope, setScope] = useState(props.defaultScope ?? props.scopeOptions[0]?.value);
    const [networkError, setNetworkError] = useState(false);

    const load = () => props.api.list()
            .then(setTokens)
            .catch(() => message.error("Failed to load the API tokens"));

    useState(() => {
        void load();
        return undefined;
    });

    const openCreate = () => {
        setCreating(true);
        props.api.defaultNetwork()
                .then(value => {
                    setSuggestion(value);
                    setNetwork(value.network ?? "");
                })
                .catch(() => setSuggestion(null));
    };

    const submit = () => {
        if (!isValidNetwork(network)) {
            setNetworkError(true);
            return;
        }
        setNetworkError(false);
        props.api.createToken({
            description: description.trim(),
            network: network.trim(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            scope
        }).then(value => {
            setCreated(value);
            setCreating(false);
            void load();
        }).catch(() => message.error("Failed to create the API token"));
    };

    const remove = (token: MockToken) => props.api.deleteToken(token.id)
            .then(() => {
                message.success(`API token ${token.token_prefix} deleted`);
                void load();
            })
            .catch(() => message.error("Failed to delete the API token"));

    return <div className="DarkDiv">
        <h1>API tokens</h1>
        <button onClick={openCreate}>Create token</button>
        <p>{props.description}</p>
        <div className="ant-table-sticky-holder" style={{top: "60px"}}>
            {tokens.map(token => <div key={token.id}>
                <code>{token.token_prefix}…</code>
                <span>{token.description}</span>
                <span>{token.scope}</span>
                <code>{token.network}</code>
                <span>{token.last_used ? token.last_used : "never"}</span>
                <button aria-label={`Delete token ${token.token_prefix}`} onClick={() => {
                    const confirmation = document.createElement("button");
                    confirmation.textContent = "Delete";
                    confirmation.onclick = () => {
                        confirmation.remove();
                        void remove(token);
                    };
                    document.body.appendChild(confirmation);
                }}/>
            </div>)}
        </div>
        {creating && <div role="dialog">
            <h2>{props.creationTitle}</h2>
            <input placeholder={props.descriptionPlaceholder} value={description} onChange={event => setDescription(event.target.value)}/>
            <input aria-label="Allowed network (IPv4 or IPv6, CIDR or single address)" role="combobox" value={network}
                   onChange={event => {
                       setNetwork(event.target.value);
                       setNetworkError(false);
                   }}/>
            <p>{props.networkHint(suggestion)}</p>
            {networkError && <p>Enter an IPv4/IPv6 address or CIDR network</p>}
            {props.scopeOptions.map(option => <label key={option.value}>
                <input type="radio" name="scope" aria-label={option.label} checked={scope === option.value} onChange={() => setScope(option.value)}/>
                {option.label}
            </label>)}
            <button onClick={submit}>Create</button>
            <button onClick={() => setCreating(false)}>Cancel</button>
        </div>}
        {created && <div role="dialog">
            <p data-testid="created-token">{created.token}</p>
            <p>{props.createdTokenDescription(created.api_token)}</p>
            <button aria-label="Close" onClick={() => setCreated(null)}>I have stored the token</button>
        </div>}
    </div>;
}

export const trackTaskMock = jest.fn();

export function useTaskProgress() {
    return {tasks: [], trackTask: trackTaskMock, closeTask: jest.fn(), cancelTask: jest.fn(), refresh: jest.fn()};
}

export function TaskProgressProvider({children}: { taskAPI?: TaskAPI; children: ReactNode }) {
    return <>{children}</>;
}

export function TaskProgressTray() {
    return null;
}

export interface SplitAction {
    key: string;
    label: ReactNode;
    onClick?: () => void | Promise<void>;
    disabled?: boolean;
}

export interface SplitActionButtonProps {
    actions: SplitAction[];
    defaultActionKey?: string;
    selectedActionKey?: string;
    onActionSelect?: (key: string) => void;
    htmlType?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    menuLabel?: string;
    "data-testid"?: string;
}

export const SPLIT_ACTION_MENU_LABEL = "Choose action";

/**
 * The split button reduced to its contract: the main button shows and runs the selected action, one plain button per action ("Select: <label>",
 * so that the main button stays the only element with the plain label) stands in for the menu and only selects (never runs) its action.
 */
export function SplitActionButton({actions, defaultActionKey, selectedActionKey, onActionSelect, htmlType = "button", disabled, menuLabel,
                                      "data-testid": testId}: SplitActionButtonProps) {
    const [internalKey, setInternalKey] = useState<string | undefined>(defaultActionKey);
    const selected = actions.find(action => action.key === (selectedActionKey ?? internalKey)) ?? actions[0];
    if (!selected) {
        return null;
    }
    return (
            <span data-testid={testId} role="group" aria-label={menuLabel ?? SPLIT_ACTION_MENU_LABEL}>
                <button type={htmlType} disabled={disabled} data-testid={testId ? `${testId}-main` : undefined}
                        onClick={() => void selected.onClick?.()}>{selected.label}</button>
                {actions.map(action => (
                        <button key={action.key} type="button" disabled={disabled || action.disabled} data-testid={`${testId ?? "split"}-option-${action.key}`}
                                onClick={() => {
                                    if (selectedActionKey === undefined) setInternalKey(action.key);
                                    onActionSelect?.(action.key);
                                }}>Select: {action.label}</button>
                ))}
            </span>
    );
}

// ----- the clustered map (src/map of the library): the API client as an inert class, the view reduced to its contract

export class MapAPI {
    readonly baseURL: string;
    readonly member: string;

    constructor(baseURL: string, member: string) {
        this.baseURL = baseURL;
        this.member = member;
    }

    getClusters = jest.fn(async () => ({precision: 0, clustered: true, total_points: 0, truncated: false, clusters: []}));
    getClusterFiles = jest.fn(async () => []);
}

export interface MapFileResponse {
    id: number;
    filename: string;
    file_path: string;
    file_type: string;
    mimetype: string;
    latitude: number;
    longitude: number;
    original_datetime: string | null;
    thumbnail_id: number | null;
}

export interface MapViewProps {
    source: { getClusters: (...args: unknown[]) => unknown; getClusterFiles: (...args: unknown[]) => unknown };
    fileTypes: { value: string; label: string }[];
    renderFileDetails: (file: MapFileResponse) => ReactNode;
    renderThumbnail?: (file: MapFileResponse) => ReactNode;
    searchTags?: (search: string) => Promise<string[]>;
    tileUrl: string;
    attribution: string;
}

/** A sample resource the stub hands to the host's render callbacks, so that tests can see the host's details and thumbnail wiring */
export const MAP_STUB_FILE: MapFileResponse = {
    id: 42, filename: "stub.jpg", file_path: "/stub", file_type: "IMAGE", mimetype: "image/jpeg", latitude: 60.17123, longitude: -24.94156,
    original_datetime: "2026-06-01T12:00:00Z", thumbnail_id: 77
};

/**
 * The map view reduced to its contract: the file type options and tile settings are exposed as data attributes, the render callbacks are
 * invoked with MAP_STUB_FILE on demand and the tag search can be triggered with a button.
 */
export function MapView({source, fileTypes, renderFileDetails, renderThumbnail, searchTags, tileUrl, attribution}: MapViewProps) {
    const [open, setOpen] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    return (
            <div data-testid="map-view" data-tile-url={tileUrl} data-attribution={attribution} data-file-types={fileTypes.map(type => type.value).join(",")}
                 data-file-type-labels={fileTypes.map(type => type.label).join(",")} data-source={source ? "set" : "missing"}>
                <button type="button" onClick={() => setOpen(true)}>stub: open file</button>
                <button type="button" onClick={() => void searchTags?.("sum").then(setTags)}>stub: search tags</button>
                <span data-testid="map-stub-tags">{tags.join(",")}</span>
                {open && <div data-testid="map-stub-details">{renderThumbnail?.(MAP_STUB_FILE)}{renderFileDetails(MAP_STUB_FILE)}</div>}
            </div>
    );
}
