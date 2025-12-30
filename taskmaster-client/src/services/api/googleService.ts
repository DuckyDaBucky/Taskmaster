export const googleService = {
  getEvents: async () => {
    const res = await fetch("/api/google/events");
    if (!res.ok) throw new Error("Failed to fetch Google events");
    return res.json();
  },
};
