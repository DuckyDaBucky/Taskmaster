/**
 * API Services - Central Export
 * 
 * All database operations go through these services.
 * Services use Supabase client directly.
 */

import { authService } from "./authService";
import { taskService } from "./taskService";
import { classService } from "./classService";
import { resourceService } from "./resourceService";
import { flashcardService } from "./flashcardService";
import { eventService } from "./eventService";
import { userService } from "./userService";
import { activityService } from "./activityService";
import { chatService } from "./chatService";
import { nebulaService } from "./nebulaService";
import { courseCatalogService } from "./courseCatalogService";

// Individual service exports (preferred)
export {
  authService,
  taskService,
  classService,
  resourceService,
  flashcardService,
  eventService,
  userService,
  activityService,
  chatService,
  nebulaService,
  courseCatalogService,
};

/**
 * Legacy ApiService class
 * Provides a single object with all methods for backward compatibility.
 * New code should import individual services instead.
 */
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

  // Activity
  getActivities = activityService.getActivities;

  // Chat
  getMessages = chatService.getMessages;
  sendMessage = chatService.sendMessage;
  getOrCreateChat = chatService.getOrCreateChat;
  getUserChats = chatService.getUserChats;
  getFriends = chatService.getFriends;
}

export const apiService = new ApiService();
