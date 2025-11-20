from User import User
from user_matching import *
from mongo import *
from gameify import *

from flask import Flask, jsonify, request, make_response
from flask_restful import Resource, Api
from flask_cors import CORS
from bson.objectid import ObjectId
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
        data = request.get_json()
        userId = data.get('userId')

        users = client['test']['users']
        user_object = users.update_one(
            {"_id": ObjectId(userId)}, 
            {"$set": {
                "preferences": {
                    "personality": data.get('personality'),
                    "time": data.get('preferred_time'),
                    "inPerson": data.get('in_person'),
                    "privateSpace": data.get('private_space'),
                }
            }}
        )
        
        if not user_object:
            return 400
        print (userId)
        return 200


class FinishTask(Resource):
    def post(self):
        users = client['test']['users']
        userId = request.get_json().get('userId')
        user = users.find_one({"_id": ObjectId(userId)})
        
        user.last_task_date = datetime.now().date() - timedelta(days=1)  # for streak

        tasks = [
            ("monthly", date.today() + timedelta(days=10)),
            ("monthly", date.today() + timedelta(days=10)),
            ("monthly", date.today() + timedelta(days=10)),
            ("monthly", date.today() + timedelta(days=10)),
            ("daily", date.today() + timedelta(days=1)),
            ("daily", date.today() + timedelta(days=1)),
            ("daily", date.today() + timedelta(days=1))
        ]

        for i, (task_type, deadline) in enumerate(tasks):
            print(f"\n--- Task {i+1} ---")
            ps = PointSystem(user, task_type, deadline)
            earned = ps.calculate_points()
            print(f"Earned: {earned}")
            print(f"Streak: {user.streak}")
            print(f"Points: {user.points}")
            print(f"Level: {user.level}")


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
api.add_resource(GenerateFlashcards, "/generate_flashcards")

if __name__ == "__main__":
    app.run(host="localhost", port=6005, debug=True)
