/* eslint-disable react-refresh/only-export-components -- Jest manual mock, not an application module */
/**
 * Manual Jest mock of @vempain/vempain-common-frontend (the package ships an ESM build that the CommonJS test runtime cannot load,
 * like @vempain/vempain-auth-frontend). The models are real; the task API client, provider, tray and hook are inert stand-ins.
 * Tests that need to assert on task tracking spy on `trackTaskMock` or provide their own jest.mock factory.
 */
import type {ReactNode} from "react";

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
