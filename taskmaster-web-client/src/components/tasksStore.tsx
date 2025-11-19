import type { TasksData } from "../pages/Tasks";

let tasksCache: TasksData[] = [];

export const getTasks = () => tasksCache;

export const setTasks = (tasks: TasksData[]) => {
  tasksCache = tasks;
};
