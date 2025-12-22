/**
 * Task Event Emitter
 * Notifies components when tasks are modified
 */

type TaskEventType = 'task-created' | 'task-updated' | 'task-deleted' | 'tasks-changed';

type TaskEventListener = (eventType: TaskEventType, taskId?: string) => void;

const listeners = new Set<TaskEventListener>();

export const taskEvents = {
    subscribe(listener: TaskEventListener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    emit(eventType: TaskEventType, taskId?: string) {
        listeners.forEach(listener => listener(eventType, taskId));
    },
};
