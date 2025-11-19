import { Dialog } from "@headlessui/react";
import { Fragment } from "react";

interface MyEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  isEditing: boolean;
  eventData: MyEvent;
  setEventData: (data: MyEvent) => void;
  onClose: () => void;
  onSave: (event: MyEvent) => void;
  onDelete: () => void;
}

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  isEditing,
  eventData,
  setEventData,
  onClose,
  onSave,
  onDelete,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
        <Dialog.Panel className="w-full max-w-xl bg-white dark:bg-darkCard p-6 rounded-2xl shadow-xl ring-1 ring-gray-200 dark:ring-zinc-700 overflow-hidden">
          <Dialog.Title className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {isEditing ? "Edit Event" : "Add New Event"}
          </Dialog.Title>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(eventData);
            }}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-darkText">
                Title
              </label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-darkAccent px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyAccent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-darkText">
                Location
              </label>
              <input
                type="text"
                value={eventData.location || ""}
                onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                placeholder="Enter event location"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-darkAccent px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyAccent focus:outline-none"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-darkText">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(eventData.start)}
                  onChange={(e) => setEventData({ ...eventData, start: new Date(e.target.value) })}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-darkAccent px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyAccent focus:outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-darkText">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(eventData.end)}
                  onChange={(e) => setEventData({ ...eventData, end: new Date(e.target.value) })}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-darkAccent px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyAccent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-darkText">
                Description
              </label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-darkAccent px-3 py-2 text-gray-900 dark:text-white resize-none h-24 focus:ring-2 focus:ring-skyAccent focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-between items-center gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Delete
                </button>
              )}
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-skyPrimary hover:bg-skySecondary text-gray-900 font-semibold rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddEventModal;
