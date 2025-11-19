from pymongo.mongo_client import MongoClient
from datetime import datetime
from bson.objectid import ObjectId


class User:
    def __init__(self, userId: str="", client: MongoClient=None, userObject: dict=None):
        if userId:
            userObject = client['test']['users'].find_one({"_id": ObjectId(userId)})

        self.userId = userObject.get("_id")
        self.preferences = userObject.get("preferences")
        self.name = userObject.get("userName")
        self.points = userObject.get("points") if userObject.get("points") else 0
        self.streak = userObject.get("streak") if userObject.get("streak") else 0
        self.last_task_date = userObject.get("lastTaskDate")
        self.group_number = userObject.get("groupNumber") if userObject.get("groupNumber") else 0
        self.level = userObject.get("level") if userObject.get("level") else 1

    def streak_update(self, client: MongoClient):
        db = client['test']
        users = db['users']

        query_filter = {'_id': self.userId}
        update_operation = {"$set": {
                "streak": self.streak,
                "lastTaskDate": self.last_task_date,
            }
        }

        users.update_one(query_filter, update_operation)

    def to_vector(self):
        return [
            self.preferences.get('personality'),
            self.preferences.get('time'),
            int(self.preferences.get('inPerson')),
            int(self.preferences.get('privateSpace')) if self.preferences.get('in_person') else -1,
        ]
    
        # return [self.personality,
        #         self.preferred_time,
        #         int(self.in_person),
        #         int(self.private_space) if self.in_person else -1]
