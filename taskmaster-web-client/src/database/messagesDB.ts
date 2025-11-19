export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

export const MESSAGES: Message[] = [
    {
        id: "msg-001",
        senderId: "user-001",
        receiverId: "dev-user-id",
        content: "Hey, are you working on the algorithms assignment?",
        timestamp: "2024-11-18T10:30:00Z",
        isRead: true,
    },
    {
        id: "msg-002",
        senderId: "dev-user-id",
        receiverId: "user-001",
        content: "Yeah, I just started. It's pretty tough.",
        timestamp: "2024-11-18T10:32:00Z",
        isRead: true,
    },
    {
        id: "msg-003",
        senderId: "user-001",
        receiverId: "dev-user-id",
        content: "Want to study together later?",
        timestamp: "2024-11-18T10:33:00Z",
        isRead: false,
    },
    {
        id: "msg-004",
        senderId: "user-003",
        receiverId: "dev-user-id",
        content: "Did you see the notes for the database class?",
        timestamp: "2024-11-19T09:15:00Z",
        isRead: false,
    },
];
