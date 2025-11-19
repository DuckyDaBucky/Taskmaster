/**
 * Mock NoSQL Database Service
 * This simulates a NoSQL database with fake data for development
 * When MongoDB is ready, switch USE_MOCK_DB to false in config
 */

// ===== Type Definitions =====
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
  password?: string; // For login validation
  friendsList?: string[]; // Array of friend user IDs
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
  user: string; // userId
}

export interface TasksData {
  _id: string;
  deadline: string;
  topic: string;
  title: string;
  status: "pending" | "completed" | "overdue";
  points: number | null;
  textbook: string | null;
  class: string; // classId
}

export interface ResourceData {
  _id: string;
  urls: string[];
  class: string; // classId
}

export interface FlashcardsData {
  topic: string;
  question: string;
  answer: string;
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

// ===== Mock Database Storage =====
class MockDatabase {
  private users: Map<string, UserData> = new Map();
  private classes: Map<string, ClassData> = new Map();
  private tasks: Map<string, TasksData> = new Map();
  private resources: Map<string, ResourceData> = new Map();
  private flashcards: Map<string, FlashcardsData[]> = new Map(); // classId -> flashcards
  private friends: Map<string, Friend[]> = new Map(); // userId -> friends
  private tokens: Map<string, string> = new Map(); // token -> userId

  constructor() {
    this.initializeDefaultData();
  }

  // ===== Initialization =====
  private initializeDefaultData() {
    // Create default dev user (matches bypass user)
    const defaultUserId = "dev-user-id";
    const defaultUser: UserData = {
      _id: defaultUserId,
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
    };
    this.users.set(defaultUserId, defaultUser);
    this.tokens.set("dev-bypass-token", defaultUserId);

    // Create additional fake users for friends
    this.createFakeUsers();

    // Create classes for default user
    const classIds = this.createFakeClasses(defaultUserId);

    // Create tasks for those classes
    this.createFakeTasks(classIds);

    // Create resources
    this.createFakeResources(classIds);

    // Create flashcards
    this.createFakeFlashcards(classIds);

    // Create friends
    this.createFakeFriends(defaultUserId, classIds);
  }

  private createFakeUsers() {
    const fakeUsers = [
      {
        _id: "user-001",
        name: "Alex Martinez",
        username: "alex_m",
        email: "alex@example.com",
        password: "password123",
      },
      {
        _id: "user-002",
        name: "Jane Doe",
        username: "jane.doe23",
        email: "jane@example.com",
        password: "password123",
      },
      {
        _id: "user-003",
        name: "Ron Techie",
        username: "ron_techie",
        email: "ron@example.com",
        password: "password123",
      },
      {
        _id: "user-004",
        name: "Maria Writes",
        username: "maria.writes",
        email: "maria@example.com",
        password: "password123",
      },
      {
        _id: "user-005",
        name: "Kevin Codes",
        username: "kevin.codes",
        email: "kevin@example.com",
        password: "password123",
      },
    ];

    fakeUsers.forEach((user) => {
      this.users.set(user._id, {
        ...user,
        preferences: {
          personality: Math.random(),
          inPerson: Math.random() < 0.5 ? 0 : 1,
          privateSpace: Math.random() < 0.5 ? 0 : 1,
          time: Math.floor(Math.random() * 3) + 1,
        },
        points: Math.floor(Math.random() * 2000),
        streak: Math.floor(Math.random() * 30),
        level: Math.floor(Math.random() * 10) + 1,
      });
    });
  }

  private createFakeClasses(userId: string): string[] {
    const classes: ClassData[] = [
      {
        _id: "class-001",
        name: "Introduction to Computer Science",
        professor: "Dr. Sarah Johnson",
        timing: "MWF 10:00 AM - 11:00 AM",
        examDates: ["2024-12-15", "2024-12-20"],
        topics: ["Algorithms", "Data Structures", "Programming Basics"],
        gradingPolicy: "Homework 40%, Midterm 30%, Final 30%",
        contactInfo: "sjohnson@university.edu",
        textbooks: ["Introduction to Algorithms", "Data Structures and Algorithms"],
        location: "Building A, Room 205",
        user: userId,
      },
      {
        _id: "class-002",
        name: "Database Systems",
        professor: "Prof. Michael Chen",
        timing: "TTh 2:00 PM - 3:30 PM",
        examDates: ["2024-12-18"],
        topics: ["SQL", "NoSQL", "Database Design", "Normalization"],
        gradingPolicy: "Projects 50%, Quizzes 20%, Final 30%",
        contactInfo: "mchen@university.edu",
        textbooks: ["Database System Concepts"],
        location: "Building B, Room 310",
        user: userId,
      },
      {
        _id: "class-003",
        name: "Web Development",
        professor: "Dr. Emily Rodriguez",
        timing: "MW 1:00 PM - 2:30 PM",
        examDates: ["2024-12-22"],
        topics: ["React", "Node.js", "REST APIs", "Deployment"],
        gradingPolicy: "Labs 40%, Project 40%, Final 20%",
        contactInfo: "erodriguez@university.edu",
        textbooks: ["Learn React", "Full Stack Development"],
        location: "Building C, Room 120",
        user: userId,
      },
    ];

    classes.forEach((cls) => {
      this.classes.set(cls._id, cls);
    });

    return classes.map((c) => c._id);
  }

  private createFakeTasks(classIds: string[]) {
    const taskTemplates = [
      { title: "Complete Assignment 1", topic: "Algorithms", points: 50 },
      { title: "Read Chapter 3", topic: "Data Structures", points: 20 },
      { title: "Lab Report", topic: "Programming", points: 30 },
      { title: "Midterm Project", topic: "Full Stack", points: 100 },
      { title: "Quiz Preparation", topic: "Database Design", points: 15 },
      { title: "Homework 5", topic: "SQL Queries", points: 40 },
    ];

    let taskId = 1;
    classIds.forEach((classId) => {
      taskTemplates.forEach((template) => {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 14));
        const statuses: ("pending" | "completed" | "overdue")[] = ["pending", "completed", "overdue"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const task: TasksData = {
          _id: `task-${String(taskId++).padStart(3, "0")}`,
          deadline: deadline.toISOString().split("T")[0],
          topic: template.topic,
          title: template.title,
          status,
          points: template.points,
          textbook: "Textbook Name",
          class: classId,
        };

        this.tasks.set(task._id, task);
      });
    });
  }

  private createFakeResources(classIds: string[]) {
    classIds.forEach((classId, idx) => {
      const resource: ResourceData = {
        _id: `resource-${String(idx + 1).padStart(3, "0")}`,
        urls: [
          `https://example.com/resources/${classId}/lecture-1.pdf`,
          `https://example.com/resources/${classId}/notes.pdf`,
          `https://example.com/resources/${classId}/slides.pdf`,
        ],
        class: classId,
      };
      this.resources.set(resource._id, resource);
    });
  }

  private createFakeFlashcards(classIds: string[]) {
    classIds.forEach((classId, idx) => {
      const topics = ["Algorithms", "Data Structures", "React", "Node.js", "SQL"];
      const topic = topics[idx % topics.length];

      const flashcards: FlashcardsData[] = [
        {
          topic,
          question: `What is ${topic}?`,
          answer: `This is an explanation of ${topic} and its key concepts.`,
        },
        {
          topic,
          question: `How does ${topic} work?`,
          answer: `${topic} works by implementing various patterns and methodologies.`,
        },
        {
          topic,
          question: `What are the benefits of ${topic}?`,
          answer: `The benefits include efficiency, scalability, and maintainability.`,
        },
        {
          topic,
          question: `What are common use cases for ${topic}?`,
          answer: `Common use cases include web development, data processing, and system design.`,
        },
      ];

      this.flashcards.set(classId, flashcards);
    });
  }

  private createFakeFriends(userId: string, classIds: string[]) {
    const friendData: Friend[] = [
      {
        id: "user-001",
        username: "alex_m",
        isOnline: true,
        commonCourses: [classIds[0], classIds[1]],
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
        commonCourses: [classIds[0]],
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
        commonCourses: [classIds[1], classIds[2]],
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
        commonCourses: [classIds[2]],
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
        commonCourses: [classIds[0], classIds[1], classIds[2]],
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

    this.friends.set(userId, friendData);
  }

  // ===== Public API Methods =====

  // Auth endpoints
  login(email: string, password: string): string | null {
    for (const [userId, user] of this.users.entries()) {
      if (user.email === email && user.password === password) {
        const token = `token-${userId}-${Date.now()}`;
        this.tokens.set(token, userId);
        return token;
      }
    }
    return null;
  }

  signup(userData: Partial<UserData>): string {
    const userId = `user-${Date.now()}`;
    const newUser: UserData = {
      _id: userId,
      email: userData.email || "",
      name: userData.name || userData.firstName || "New User",
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      password: (userData as any).password || "defaultpass",
      preferences: userData.preferences,
      points: 0,
      streak: 0,
      level: 1,
    };
    this.users.set(userId, newUser);

    // Create a token for the new user
    const token = `token-${userId}-${Date.now()}`;
    this.tokens.set(token, userId);
    return token;
  }

  getUserByToken(token: string): UserData | null {
    const userId = this.tokens.get(token);
    if (!userId) {
      // Check for bypass token
      if (token === "dev-bypass-token") {
        return this.users.get("dev-user-id") || null;
      }
      return null;
    }
    return this.users.get(userId) || null;
  }

  getUserById(userId: string): UserData | null {
    return this.users.get(userId) || null;
  }

  // Class endpoints
  getClassesByUserId(userId: string): ClassData[] {
    return Array.from(this.classes.values()).filter((cls) => cls.user === userId);
  }

  createClass(classData: Partial<ClassData>, userId: string): ClassData {
    const classId = `class-${Date.now()}`;
    const newClass: ClassData = {
      _id: classId,
      name: classData.name || "New Class",
      professor: classData.professor || "TBA",
      timing: classData.timing || "TBA",
      examDates: classData.examDates || [],
      topics: classData.topics || [],
      gradingPolicy: classData.gradingPolicy || "TBA",
      contactInfo: classData.contactInfo || "",
      textbooks: classData.textbooks || [],
      location: classData.location || "TBA",
      user: userId,
    };
    this.classes.set(classId, newClass);
    return newClass;
  }

  // Task endpoints
  getTasksByClassId(classId: string): TasksData[] {
    return Array.from(this.tasks.values()).filter((task) => task.class === classId);
  }

  updateTask(taskId: string, updates: Partial<TasksData>): TasksData | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  createTask(taskData: Partial<TasksData>): TasksData {
    const taskId = `task-${Date.now()}`;
    const newTask: TasksData = {
      _id: taskId,
      deadline: taskData.deadline || new Date().toISOString(),
      topic: taskData.topic || "General",
      title: taskData.title || "New Task",
      status: taskData.status || "pending",
      points: taskData.points || null,
      textbook: taskData.textbook || null,
      class: taskData.class || "",
    };
    this.tasks.set(taskId, newTask);
    return newTask;
  }

  // Resource endpoints
  getResourcesByClassId(classId: string): ResourceData[] {
    return Array.from(this.resources.values()).filter((res) => res.class === classId);
  }

  createResource(resourceData: Partial<ResourceData>): ResourceData {
    const resourceId = `resource-${Date.now()}`;
    const newResource: ResourceData = {
      _id: resourceId,
      urls: resourceData.urls || [],
      class: resourceData.class || "",
    };
    this.resources.set(resourceId, newResource);
    return newResource;
  }

  // Flashcard endpoints
  getFlashcardsByClassId(classId: string): FlashcardsData[] {
    return this.flashcards.get(classId) || [];
  }

  generateFlashcards(classId: string): FlashcardsData[] {
    // Generate new flashcards or return existing
    const existing = this.flashcards.get(classId);
    if (existing) return existing;

    const topics = ["General", "Theory", "Practice"];
    const flashcards: FlashcardsData[] = topics.map((topic) => ({
      topic,
      question: `Question about ${topic}?`,
      answer: `Answer about ${topic}`,
    }));

    this.flashcards.set(classId, flashcards);
    return flashcards;
  }

  // Friend endpoints
  getMatchedFriends(userId: string): string[] {
    const friends = this.friends.get(userId);
    return friends ? friends.map((f) => f.id) : [];
  }

  getFriendsByUserId(userId: string): Friend[] {
    return this.friends.get(userId) || [];
  }

  // User preferences
  updateUserPreferences(userId: string, preferences: Partial<UserData["preferences"]>): void {
    const user = this.users.get(userId);
    if (user) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      } as UserData["preferences"];
      this.users.set(userId, user);
    }
  }

  // Utility: Get all users (for development)
  getAllUsers(): UserData[] {
    return Array.from(this.users.values());
  }
}

// ===== Singleton Instance =====
export const mockDB = new MockDatabase();

