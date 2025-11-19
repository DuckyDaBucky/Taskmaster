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


api.add_resource(MatchRequest, "/match")
api.add_resource(SetPreferences, "/set")
api.add_resource(FinishTask, "/finish")

if __name__ == "__main__":
    app.run(host="localhost", port=6005, debug=True)
