import { taskService } from "./services/taskService";
import { chatService } from "./services/chatService";

async function testServices() {
    console.log("Testing Task Service...");
    const tasks = await taskService.getTasks();
    console.log("Tasks:", tasks);

    console.log("Testing Chat Service (Messages)...");
    const messages = await chatService.getMessages("user-001");
    console.log("Messages:", messages);

    console.log("Testing Chat Service (Friends)...");
    const friends = await chatService.getFriends("user-001");
    console.log("Friends:", friends);
}

testServices();
