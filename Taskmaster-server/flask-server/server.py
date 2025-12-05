from User import User
from user_matching import *
from supabase_client import get_supabase, verify_token
from gameify import *

# Remove mongo import - no longer needed

from flask import Flask, jsonify, request, make_response
from flask_restful import Resource, Api
from flask_cors import CORS
from datetime import datetime, timedelta, date
import os
from dotenv import load_dotenv
import uuid

# Load .env from one directory up
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}}, supports_credentials=True)
api = Api(app)


class MatchRequest(Resource):
    def post(self):
        # Verify token
        token = request.headers.get('x-auth-token')
        if not token:
            return make_response(jsonify({"message": "Unauthorized"}), 401)
        
        user = verify_token(token)
        if not user:
            return make_response(jsonify({"message": "Invalid token"}), 401)
        
        supabase = get_supabase()
        data = request.get_json()
        userId = data.get('userId') or user.id

        # Get user from Supabase
        user_response = supabase.table('users').select('*').eq('id', userId).single().execute()
        if not user_response.data:
            return make_response(jsonify({"message": "User not found"}), 404)
        
        user_doc = user_response.data
        
        # Check if user already has group_number
        if user_doc.get('group_number'):
            # Get matched users
            matched_users = supabase.table('users').select('user_name').eq('group_number', user_doc['group_number']).neq('id', userId).execute()
            matched_usernames = [u['user_name'] for u in matched_users.data]
            return make_response(jsonify({"users": matched_usernames}), 200)

        # Get all users for matching
        all_users_response = supabase.table('users').select('*').execute()
        all_users = all_users_response.data
        
        # Convert to User objects for matching algorithm
        match_client = UserMatchClient(users=[User(userObject=u) for u in all_users])

        while len(match_client.unmatched_users) >= 2:
            matched = False
            for user_obj in match_client.unmatched_users[:]:  
                if match_client.match(user_obj):
                    matched = True
                    break  
            if not matched:
                print("No more possible matches.")
                break
        
        # Update group numbers in Supabase
        for u in match_client.users:
            supabase.table('users').update({'group_number': u.group_number}).eq('id', str(u.userId)).execute()
            
        # Find matched users for the requesting user
        for u in match_client.users:
            if str(u.userId) == str(userId):
                matched_usernames = []
                for u2 in match_client.users:
                    if u.group_number == u2.group_number:
                        if str(u2.userId) != str(userId):
                            matched_usernames.append(u2.name)

                return make_response(jsonify({"users": matched_usernames}), 200)

        return make_response(jsonify({"message": "Error grouping user"}), 404)


class SetPreferences(Resource):
    def post(self):
        try:
            # Verify token
            token = request.headers.get('x-auth-token')
            if not token:
                return make_response(jsonify({"message": "Unauthorized"}), 401)
            
            auth_user = verify_token(token)
            if not auth_user:
                return make_response(jsonify({"message": "Invalid token"}), 401)
            
            data = request.get_json()
            userId = data.get('userId') or auth_user.id

            if not userId:
                return make_response(jsonify({"message": "userId is required"}), 400)

            supabase = get_supabase()
            
            # Update user preferences in Supabase
            result = supabase.table('users').update({
                'personality': data.get('personality'),
                'time_preference': data.get('time'),
                'in_person': data.get('inPerson'),
                'private_space': data.get('privateSpace'),
            }).eq('id', userId).execute()
            
            if not result.data:
                return make_response(jsonify({"message": "User not found"}), 404)
            
            return make_response(jsonify({"message": "Preferences updated successfully"}), 200)
        except Exception as e:
            print(f"Error setting preferences: {e}")
            return make_response(jsonify({"message": str(e)}), 500)


class FinishTask(Resource):
    def post(self):
        try:
            # Verify token
            token = request.headers.get('x-auth-token')
            if not token:
                return make_response(jsonify({"message": "Unauthorized"}), 401)
            
            auth_user = verify_token(token)
            if not auth_user:
                return make_response(jsonify({"message": "Invalid token"}), 401)
            
            data = request.get_json()
            userId = data.get('userId') or auth_user.id
            taskId = data.get('taskId')

            if not userId:
                return make_response(jsonify({"message": "userId is required"}), 400)

            supabase = get_supabase()
            
            # Get user from Supabase
            user_response = supabase.table('users').select('*').eq('id', userId).single().execute()
            if not user_response.data:
                return make_response(jsonify({"message": "User not found"}), 404)
            
            user_doc = user_response.data

            # Get task to determine type and deadline
            task_doc = None
            if taskId:
                task_response = supabase.table('tasks').select('*').eq('id', taskId).single().execute()
                if task_response.data:
                    task_doc = task_response.data
            
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

            # Create User object (convert Supabase format to expected format)
            user_obj = {
                '_id': user_doc['id'],
                'points': user_doc.get('points', 0),
                'streak': user_doc.get('streak', 0),
                'level': user_doc.get('level', 1),
                'lastTaskDate': user_doc.get('last_task_date'),
            }
            user = User(userObject=user_obj)
            
            # Calculate points
            ps = PointSystem(user, task_type, deadline_date)
            earned_points = ps.calculate_points()
            
            # Update user in Supabase
            update_data = {
                'points': user.points,
                'streak': user.streak,
                'level': user.level,
            }
            if user.last_task_date:
                update_data['last_task_date'] = user.last_task_date.isoformat()
            
            supabase.table('users').update(update_data).eq('id', userId).execute()
            
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
