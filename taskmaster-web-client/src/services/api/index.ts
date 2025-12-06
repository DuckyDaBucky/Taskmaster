// Centralized API service exports
// This maintains backward compatibility while using modular services

import { apiClient, mlClient } from "./client";
import { authService } from "./authService";
import { taskService } from "./taskService";
import { classService } from "./classService";
import { resourceService } from "./resourceService";
import { flashcardService } from "./flashcardService";
import { eventService } from "./eventService";
import { userService } from "./userService";
import { mlService } from "./mlService";
import { activityService } from "./activityService";
import { chatService } from "./chatService";
import { aiService } from "./aiService";

// Re-export individual services
export {
  authService,
  taskService,
  classService,
  resourceService,
  flashcardService,
  eventService,
  userService,
  mlService,
  activityService,
  chatService,
  aiService,
  apiClient,
  mlClient,
};

// Legacy ApiService class for backward compatibility
class ApiService {
  // Auth
  login = authService.login;
  signup = authService.signup;
  getUserMe = authService.getUserMe;
  updateProfile = authService.updateProfile;
  getLoginDates = authService.getLoginDates;

  // Tasks
  getAllTasks = taskService.getAllTasks;
  getTasksByClassId = taskService.getTasksByClassId;
  createTask = taskService.createTask;
  updateTask = taskService.updateTask;
  deleteTask = taskService.deleteTask;

  // Classes
  getAllClasses = classService.getAllClasses;
  getClassesByUserId = classService.getClassesByUserId;
  getPersonalClassId = classService.getPersonalClassId;
  createClass = classService.createClass;
  updateClass = classService.updateClass;
  deleteClass = classService.deleteClass;
  uploadSyllabus = classService.uploadSyllabus;

  // Resources
  getAllResources = resourceService.getAllResources;
  getResourcesByClassId = resourceService.getResourcesByClassId;
  createResource = resourceService.createResource;
  smartUploadResource = resourceService.smartUploadResource;

  // Flashcards
  getAllFlashcards = flashcardService.getAllFlashcards;
  getFlashcardsByClassId = flashcardService.getFlashcardsByClassId;
  generateFlashcards = flashcardService.generateFlashcards;
  createManualFlashcards = flashcardService.createManualFlashcards;

  // Events
  createEvent = eventService.createEvent;
  getEvents = eventService.getEvents;
  updateEvent = eventService.updateEvent;
  deleteEvent = eventService.deleteEvent;

  // Users/Friends
  addHamizAsFriend = userService.addHamizAsFriend;
  getFriendsFromUserService = userService.getFriends;

  // ML Service
  setPoints = mlService.setPoints;
  matchFriends = mlService.matchFriends;
  setPreferences = mlService.setPreferences;
  completeTask = mlService.completeTask;

  // Activity
  getActivities = activityService.getActivities;

  // Chat
  getMessages = chatService.getMessages;
  sendMessage = chatService.sendMessage;
  getOrCreateChat = chatService.getOrCreateChat;
  getUserChats = chatService.getUserChats;
  getFriends = chatService.getFriends;

  // AI Service (RAG)
  processDocument = aiService.processDocument;
  searchDocuments = aiService.search;
  generateAIFlashcards = aiService.generateFlashcards;
  chatWithAgent = aiService.chat;
  aiHealthCheck = aiService.healthCheck;
}

export const apiService = new ApiService();

