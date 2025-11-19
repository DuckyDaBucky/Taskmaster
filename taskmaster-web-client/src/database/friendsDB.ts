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

export const FRIENDS: Friend[] = [
    {
        id: "user-001",
        username: "alex_m",
        isOnline: true,
        commonCourses: ["class-001", "class-002"],
        streak: 5,
        xpAvailable: true,
        personalityProfile: {
            personality: 0.7,
            preferred_time: 1,
            in_person: 1,
            private_space: 1,
        },
    },
    {
        id: "user-002",
        username: "jane.doe23",
        isOnline: false,
        commonCourses: ["class-001"],
        streak: 12,
        xpAvailable: false,
        personalityProfile: {
            personality: 0.4,
            preferred_time: 2,
            in_person: 0,
            private_space: 0,
        },
    },
    {
        id: "user-003",
        username: "ron_techie",
        isOnline: true,
        commonCourses: ["class-002", "class-003"],
        streak: 8,
        xpAvailable: true,
        personalityProfile: {
            personality: 0.9,
            preferred_time: 3,
            in_person: 1,
            private_space: 0,
        },
    },
    {
        id: "user-004",
        username: "maria.writes",
        isOnline: false,
        commonCourses: ["class-003"],
        streak: 3,
        xpAvailable: false,
        personalityProfile: {
            personality: 0.5,
            preferred_time: 1,
            in_person: 0,
            private_space: 1,
        },
    },
    {
        id: "user-005",
        username: "kevin.codes",
        isOnline: true,
        commonCourses: ["class-001", "class-002", "class-003"],
        streak: 15,
        xpAvailable: true,
        personalityProfile: {
            personality: 0.6,
            preferred_time: 2,
            in_person: 1,
            private_space: 1,
        },
    },
];
