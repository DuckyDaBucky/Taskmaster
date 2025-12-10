from datetime import date, datetime, timedelta
from pymongo.mongo_client import MongoClient
from User import User

class PointSystem:
    def __init__(self, user: User, task_type, deadline):
        self.user = user
        self.task_type = task_type
        self.deadline = deadline
        self.point_dict = {"daily": 10, "weekly": 20, "monthly": 30}

    def update_streak(self):
        today = datetime.now().date()

        if (today - self.user.last_task_date).days == 1:
            self.user.streak += 1
        else:
            self.user.streak = 1

        self.user.last_task_date = today

    def calculate_points(self):
        base_points = 0
        
        if self.task_type in self.point_dict:
            base_points = self.point_dict[self.task_type]
        else:
            print(f"Unknown task type: {self.task_type}")
            return 0

        self.completion_time = date.today()

        early = (self.deadline - self.completion_time).days
        multiplier = 1.0

        if early <= 0:
            multiplier = 1.0
        elif early == 1:
            multiplier = 1.0
        elif early > 1 and early <= 7:
            multiplier = 1.5
        elif early > 7:
            multiplier = 2.0

        self.update_streak()
        self._level_up()

        earned_points = base_points * multiplier + round(self.user.streak * 1.4)
        self.user.points += earned_points

        return earned_points
    
    def get_points(self):
        return self.user.points
    
    def update_db(self, client: MongoClient, earned_points, user: User, task_id):
        db = client['test']
        users = db['tasks']

        query_filter = {'sub': user.sub} # task id?
        update_operation = {"$inc": { 
                "points": earned_points,
                "streak": user.streak,
                "lastTaskDate": user.last_task_date
            }
        }

        # "completed": True, -> task db by task id
        # "earnedPoints": earned_points, -> task db by task id

        users.update_one(query_filter, update_operation)

    def _level_up(self):
        #level 1 --> level 2: 100 points
        #as each level increases, points needed to upgrade is (0.5 * points) + points needed
        
        while True:
            points_to_level_up = 100 + (50 * (self.user.level - 1))
            if (self.user.points >= points_to_level_up):
                self.user.level += 1
            else:
                break

def test():
    user = User(sub="user123")
    user.level = 1
    user.points = 0
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

if __name__ == "__main__":
    test()
