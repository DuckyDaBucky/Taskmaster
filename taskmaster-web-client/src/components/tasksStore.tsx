import type { TasksData } from "../services/mockDatabase";

let tasksCache: TasksData[] = [];

export const getTasks = () => tasksCache;

export const setTasks = (tasks: TasksData[]) => {
  tasksCache = tasks;
};
