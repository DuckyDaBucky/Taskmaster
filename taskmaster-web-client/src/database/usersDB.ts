export interface User {
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
}

export const USERS: User[] = [
  {
    _id: "dev-user-id",
    name: "Dev User",
    firstName: "Dev",
    lastName: "User",
    username: "devuser",
    email: "dev@example.com",
    preferences: {
      personality: 0.7,
      inPerson: 0.5,
      privateSpace: 0.6,
      time: 1,
    },
    points: 1250,
    streak: 7,
    level: 3,
    password: "devpass123",
  },
  {
    _id: "user-001",
    name: "Alex Martinez",
    username: "alex_m",
    email: "alex@example.com",
    password: "password123",
    preferences: {
      personality: 0.7,
      inPerson: 1,
      privateSpace: 1,
      time: 1,
    },
    points: 1500,
    streak: 5,
    level: 2,
  },
  {
    _id: "user-002",
    name: "Jane Doe",
    username: "jane.doe23",
    email: "jane@example.com",
    password: "password123",
    preferences: {
      personality: 0.4,
      inPerson: 0,
      privateSpace: 0,
      time: 2,
    },
    points: 800,
    streak: 12,
    level: 4,
  },
  {
    _id: "user-003",
    name: "Ron Techie",
    username: "ron_techie",
    email: "ron@example.com",
    password: "password123",
    preferences: {
      personality: 0.9,
      inPerson: 1,
      privateSpace: 0,
      time: 3,
    },
    points: 2100,
    streak: 8,
    level: 5,
  },
  {
    _id: "user-004",
    name: "Maria Writes",
    username: "maria.writes",
    email: "maria@example.com",
    password: "password123",
    preferences: {
      personality: 0.5,
      inPerson: 0,
      privateSpace: 1,
      time: 1,
    },
    points: 600,
    streak: 3,
    level: 1,
  },
  {
    _id: "user-005",
    name: "Kevin Codes",
    username: "kevin.codes",
    email: "kevin@example.com",
    password: "password123",
    preferences: {
      personality: 0.6,
      inPerson: 1,
      privateSpace: 1,
      time: 2,
    },
    points: 1800,
    streak: 15,
    level: 4,
  },
];
