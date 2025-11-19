from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.environ['DB_URL']

client = MongoClient(uri, server_api=ServerApi('1'))

try:
    client.admin.command('ping')
    print("Successfully connected to MongoDB")

    # users = client['test']['users']
    # userId = ObjectId("680b03222cc0abdad3af5683")
    # print(users.find_one({"_id": userId}))
                

except Exception as e:
    print(e)