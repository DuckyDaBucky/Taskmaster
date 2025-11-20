/**
 * Type definitions for API responses
 */

export interface UserData {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    profileImageUrl?: string;
    preferences?: {
        personality: number;
        inPerson: number;
        privateSpace: number;
        time: number;
    };
    points?: number;
    streak?: number;
    level?: number;
    password?: string;
    friendsList?: string[];
}

export interface ClassData {
    _id: string;
    name: string;
    professor: string;
    timing: string;
    examDates: string[];
    topics: string[];
    gradingPolicy: string;
    contactInfo: string;
    textbooks: string[];
    location: string;
    user: string;
}

export interface TasksData {
    _id: string;
    deadline: string;
    topic: string;
    title: string;
    status: "pending" | "completed" | "overdue";
    points: number | null;
    textbook: string | null;
    class: string;
}

export interface ResourceData {
    _id: string;
    urls: string[];
    class: string;
    summary?: string;
    files?: any[];
}

export interface FlashcardsData {
    _id?: string;
    topic: string;
    question: string;
    answer: string;
    class?: string | any;
}

export interface Friend {
    id: string;
    username: string;
    isOnline: boolean;
    commonCourses: string[];
    notes?: string;
    streak?: number;
    xpAvailable?: boolean;
    personalityProfile: {
        personality: number;
        preferred_time: number;
        in_person: number;
        private_space: number;
    };
}
