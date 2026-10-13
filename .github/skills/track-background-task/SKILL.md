---
name: track-background-task
description: Call an admin backend endpoint that answers 202 with a background task (publishing, refresh, data sets) and show its progress in the task tray instead of a blocking spinner. Use for any long operation.
---

# Track a background task in vempain-admin-frontend

- Page and gallery publishing, publish-all/selected, refresh-all gallery files and data set publishing answer `202` with a
  `TaskAcceptedResponse` (`PublishResponse.task`, `RefreshResponse.task`, bare task for `dataAPI.publishDataSet`). A scheduled publish
  answers `200` without a task.
- In the screen: `const {trackTask} = useTaskProgress()` from `@vempain/vempain-common-frontend`; after the call
  `trackTask(task, {onFinished: () => reload()})` and tell the user the work started. Never show a blocking spinner for it.
- `src/services/TaskAPI.ts` creates `taskAPI`; `App.tsx` mounts `<TaskProgressProvider taskAPI={taskAPI}>` and `<TaskProgressTray/>`; tray
  texts are the `TaskProgress.*` keys in `src/i18n.ts`. The tray shows one step per file transferred (publishing counts the smallest
  items), X closes the card, Cancel stops the task between items.
- Tests mock `@vempain/vempain-common-frontend` (`useTaskProgress: () => ({trackTask})`) and assert the call.
