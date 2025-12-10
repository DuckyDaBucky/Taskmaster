from datetime import date, datetime, timedelta
from pymongo.mongo_client import MongoClient
from User import User

class Priority:
    def __init__(self, user: User, deadline, task, task_type, grade):
        self.user = user
        self.deadline = deadline
        self.task = task
        self.task_type = task_type
        self.grade = grade

    def get_priority(self):
        #priority level system?
        #level 1 --> daily
        #level 2 --> weekly
        #level 3 --> monthly

        #higher number --> more priority
        task_priority = 0
        grade_priority = 0
        hurry = 0

        if self.task_type == "daily":
            task_priority = 1
        elif self.task_type == "weekly":
            task_priority = 2
        else:
            task_priority = 3

        if self.grade >= 98:
            grade_priority = 0
        elif self.grade >= 93 and self.grade < 98:
            grade_priority = 1
        elif self.grade >= 90 and self.grade < 93:
            grade_priority = 2
        elif self.grade >= 87 and self.grade < 90:
            grade_priority = 3
        elif self.grade >= 83 and self.grade < 87:
            grade_priority = 4
        elif self.grade >= 80 and self.grade < 83:
            grade_priority = 5
        elif self.grade >= 77 and self.grade < 80:
            grade_priority = 6
        elif self.grade >= 73 and self.grade < 77:
            grade_priority = 7
        elif self.grade >= 70 and self.grade < 73:
            grade_priority = 8
        elif self.grade >= 67 and self.grade < 70:
            grade_priority = 9
        elif self.grade >= 63 and self.grade < 67:
            grade_priority = 10
        elif self.grade < 60:
            grade_priority = 11 #FAIL - HIGHEST PRIORITY
        
        if self.deadline == date.today():
            hurry = 5
        elif self.deadline <= date.today() + timedelta(days=3) and self.deadline > date.today():
            hurry = 4
        elif self.deadline <= date.today() + timedelta(days=7) and self.deadline > date.today() + timedelta(days=3):
            hurry = 3
        elif self.deadline <= date.today() + timedelta(days=10) and self.deadline > date.today() + timedelta(days=7):
            hurry = 2
        elif self.deadline <= date.today() + timedelta(days=10) and self.deadline > date.today() + timedelta(days=14):
            hurry = 1
        else:
            hurry = 0