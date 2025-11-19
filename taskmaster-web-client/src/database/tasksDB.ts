export interface Task {
    _id: string;
    deadline: string;
    topic: string;
    title: string;
    status: "pending" | "completed" | "overdue";
    points: number | null;
    textbook: string | null;
    class: string; // classId
}

export const TASKS: Task[] = [
    {
        _id: "task-001",
        deadline: "2024-12-01",
        topic: "Algorithms",
        title: "Complete Assignment 1",
        status: "pending",
        points: 50,
        textbook: "Introduction to Algorithms",
        class: "class-001",
    },
    {
        _id: "task-002",
        deadline: "2024-12-05",
        topic: "Data Structures",
        title: "Read Chapter 3",
        status: "completed",
        points: 20,
        textbook: "Data Structures and Algorithms",
        class: "class-001",
    },
    {
        _id: "task-003",
        deadline: "2024-12-10",
        topic: "Programming",
        title: "Lab Report",
        status: "overdue",
        points: 30,
        textbook: null,
        class: "class-001",
    },
    {
        _id: "task-004",
        deadline: "2024-12-15",
        topic: "Full Stack",
        title: "Midterm Project",
        status: "pending",
        points: 100,
        textbook: "Full Stack Development",
        class: "class-003",
    },
    {
        _id: "task-005",
        deadline: "2024-12-08",
        topic: "Database Design",
        title: "Quiz Preparation",
        status: "pending",
        points: 15,
        textbook: "Database System Concepts",
        class: "class-002",
    },
    {
        _id: "task-006",
        deadline: "2024-12-12",
        topic: "SQL Queries",
        title: "Homework 5",
        status: "completed",
        points: 40,
        textbook: "Database System Concepts",
        class: "class-002",
    },
];
