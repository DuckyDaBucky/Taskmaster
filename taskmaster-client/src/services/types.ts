/**
 * Type definitions for API responses
 */

export interface UserData {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    displayName?: string;
    email: string;
    profileImageUrl?: string;
    preferences?: {
        personality: number;
        inPerson: number;
        privateSpace: number;
        time: number;
    };
    theme?: string;
    settings?: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        weeklyDigest: boolean;
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
    user?: string;
    description?: string;
    isPersonal?: boolean;
}

export interface TasksData {
    _id: string;
    deadline?: string;
    topic?: string;
    title: string;
    description?: string;
    status: "pending" | "completed" | "overdue";
    points: number | null;
    textbook: string | null;
    class?: string;
    completed?: boolean;
    earnedPoints?: number;
    taskType?: string;
}

export interface ResourceData {
    _id: string;
    title?: string;
    urls: string[];
    websites?: string[];
    class?: string;
    summary?: string;
    description?: string;
    files?: any[];
    processing_status?: 'pending' | 'processing' | 'complete' | 'failed';
    ai_summary?: string;
    extracted_data?: {
        document_type?: string;
        course_number?: string;
        course_name?: string;
        professor?: string;
        key_topics?: string[];
        due_dates?: Array<{ date: string; description: string }>;
        analyzed_at?: string;
        [key: string]: any;
    };
    classification?: string;
}

export interface FlashcardsData {
    _id?: string;
    topic: string;
    question: string;
    answer: string;
    class?: string | any;
    description?: string;
}

export interface NoteData {
    _id: string;
    classId: string;
    topic: string;
    title: string;
    content: string;
    resourceId?: string | null;
    createdAt: string;
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
