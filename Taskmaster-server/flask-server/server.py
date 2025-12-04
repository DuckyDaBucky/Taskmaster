from User import User
from user_matching import *
from mongo import *
from gameify import *

from flask import Flask, jsonify, request, make_response
from flask_restful import Resource, Api
from flask_cors import CORS
from bson.objectid import ObjectId
from datetime import datetime, timedelta, date
import os
from dotenv import load_dotenv

# Load .env from one directory up
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}}, supports_credentials=True)
api = Api(app)


class MatchRequest(Resource):
    def post(self):
        users = client['test']['users']
        userId = request.get_json().get('userId')

        if group_number := users.find_one({"_id": ObjectId(userId)}).get('groupNumber'):
            return make_response(jsonify({"group_number": group_number}), 200)

        match_client = UserMatchClient(users=[User(userObject=u) for u in users.find()])

        while len(match_client.unmatched_users) >= 2:
            matched = False
            for user in match_client.unmatched_users[:]:  
                if match_client.match(user):
                    matched = True
                    break  
            if not matched:
                print("No more possible matches.")
                break
        
        # for u in match_client.users:
        #     users.update_one(
        #         {"_id": ObjectId(u.userId)},
        #         {"$set": {
        #             "groupNumber": u.group_number,
        #         }},
        #     )
            
        for u in match_client.users:
            if u.userId == ObjectId(userId):
                matched_usernames = []
                for u2 in match_client.users:
                    if u.group_number == u2.group_number:
                        if u2.userId != ObjectId(userId):
                            matched_usernames.append(u2.name)

                return make_response(jsonify({"users": matched_usernames}), 200)

        return make_response(jsonify({"message": "Error grouping user"}), 404)


class SetPreferences(Resource):
    def post(self):
        try:
            data = request.get_json()
            userId = data.get('userId')

            if not userId:
                return make_response(jsonify({"message": "userId is required"}), 400)

            users = client['test']['users']
            result = users.update_one(
                {"_id": ObjectId(userId)}, 
                {"$set": {
                    "preferences": {
                        "personality": data.get('personality'),
                        "time": data.get('time'),
                        "inPerson": data.get('inPerson'),
                        "privateSpace": data.get('privateSpace'),
                    }
                }}
            )
            
            if result.matched_count == 0:
                return make_response(jsonify({"message": "User not found"}), 404)
            
            return make_response(jsonify({"message": "Preferences updated successfully"}), 200)
        except Exception as e:
            print(f"Error setting preferences: {e}")
            return make_response(jsonify({"message": str(e)}), 500)


class FinishTask(Resource):
    def post(self):
        try:
            data = request.get_json()
            userId = data.get('userId')
            taskId = data.get('taskId')

            if not userId:
                return make_response(jsonify({"message": "userId is required"}), 400)

            users = client['test']['users']
            tasks_db = client['test']['tasks']
            
            # Get user
            user_doc = users.find_one({"_id": ObjectId(userId)})
            if not user_doc:
                return make_response(jsonify({"message": "User not found"}), 404)

            # Get task to determine type and deadline
            task_doc = None
            if taskId:
                task_doc = tasks_db.find_one({"_id": ObjectId(taskId)})
            
            # Determine task type based on deadline
            task_type = "daily"  # default
            deadline_date = date.today() + timedelta(days=1)  # default
            
            if task_doc and task_doc.get('deadline'):
                deadline_date = datetime.fromisoformat(task_doc['deadline'].replace('Z', '+00:00')).date()
                days_until = (deadline_date - date.today()).days
                
                if days_until <= 1:
                    task_type = "daily"
                elif days_until <= 7:
                    task_type = "weekly"
                else:
                    task_type = "monthly"

            # Create User object
            user = User(userObject=user_doc)
            
            # Calculate points
            ps = PointSystem(user, task_type, deadline_date)
            earned_points = ps.calculate_points()
            
            # Update user in database
            users.update_one(
                {"_id": ObjectId(userId)},
                {"$set": {
                    "points": user.points,
                    "streak": user.streak,
                    "level": user.level,
                    "lastTaskDate": user.last_task_date.isoformat() if user.last_task_date else None
                }}
            )
            
            return make_response(jsonify({
                "points": user.points,
                "streak": user.streak,
                "level": user.level,
                "earnedPoints": earned_points
            }), 200)
        except Exception as e:
            print(f"Error finishing task: {e}")
            return make_response(jsonify({"message": str(e)}), 500)


class CompleteTask(Resource):
    def post(self):
        # Alias for FinishTask to match frontend API
        return FinishTask().post()


class SetPoints(Resource):
    def get(self):
        # Endpoint that frontend expects - can be used to refresh points
        return make_response(jsonify({"message": "Use POST /finish or /complete_task to update points"}), 200)


from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

class Flashcard(BaseModel):
    question: str = Field(description="The question for the flashcard")
    answer: str = Field(description="The answer for the flashcard")
    topic: str = Field(description="The specific sub-topic of this flashcard")

class FlashcardList(BaseModel):
    flashcards: List[Flashcard]

class GenerateFlashcards(Resource):
    def post(self):
        try:
            data = request.get_json()
            topic = data.get('topic')
            
            if not topic:
                return make_response(jsonify({"message": "Topic is required"}), 400)

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return make_response(jsonify({"message": "GEMINI_API_KEY not found"}), 500)

            # Initialize Gemini
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            
            # Set up parser
            parser = PydanticOutputParser(pydantic_object=FlashcardList)
            
            # Create prompt
            prompt = PromptTemplate(
                template="Generate 10 flashcards about {topic}.\n{format_instructions}\nEnsure the questions are concise and answers are accurate.",
                input_variables=["topic"],
                partial_variables={"format_instructions": parser.get_format_instructions()}
            )
            
            # Generate
            chain = prompt | llm | parser
            result = chain.invoke({"topic": topic})
            
            # Convert to dict
            flashcards_data = [card.dict() for card in result.flashcards]
            
            return make_response(jsonify({"flashcards": flashcards_data}), 200)

        except Exception as e:
            print(f"Error generating flashcards: {e}")
            return make_response(jsonify({"message": str(e)}), 500)


api.add_resource(MatchRequest, "/match")
api.add_resource(SetPreferences, "/set")
api.add_resource(FinishTask, "/finish")
api.add_resource(CompleteTask, "/complete_task")
api.add_resource(SetPoints, "/set_points")
api.add_resource(GenerateFlashcards, "/generate_flashcards")

if __name__ == "__main__":
    app.run(host="localhost", port=6005, debug=True)
