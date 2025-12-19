import type { TasksData } from "../services/types";

let tasksCache: TasksData[] = [];

export const getTasks = () => tasksCache;

export const setTasks = (tasks: TasksData[]) => {
  tasksCache = tasks;
};
