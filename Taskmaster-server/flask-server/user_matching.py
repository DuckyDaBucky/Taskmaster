import random
from datetime import date
from User import User
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
import os

os.environ["LOKY_MAX_CPU_COUNT"] = "8"


class UserMatchClient:
    def __init__(self, users: list[User], min_filter_users=10) -> None:
        self.users: list[User] = users

        for u in self.users:
            if not u.preferences:
                self.users.remove(u)

        self.unmatched_users: list[User] = self._populate_unmatched()
        self.min_filter_users: int = min_filter_users
        self.model = None
        self.feature_matrix = None
        self.user_map = {}
        self._stage: int = 0

    def _populate_unmatched(self) -> list[User]:
        return list(filter(lambda u: u.group_number == 0, self.users))

    # def _user_to_vector(self, user: User):
    #     return [user.personality,
    #             user.preferred_time,
    #             int(user.in_person),
    #             int(user.private_space) if user.in_person else -1]
    
    def build_feature_matrix(self):
        self.feature_matrix = []
        self.user_map = {}

        for i,user in enumerate(self.unmatched_users):
            # toVectorObj = self._user_to_vector(user)
            toVectorObj = user.to_vector()
            self.feature_matrix.append(toVectorObj)
            self.user_map[i] = user

        self.feature_matrix = np.array(self.feature_matrix)

    def train_model(self):
        self.build_feature_matrix()
        n_neighbors = min(4, len(self.unmatched_users))
        self.model = NearestNeighbors(n_neighbors=n_neighbors, metric='euclidean')
        self.model.fit(self.feature_matrix)

    def match(self, target_user: User):
        if len(self.unmatched_users) < 3:
            return False
        
        self.train_model()
        target_vector = np.array(target_user.to_vector()).reshape(1, -1)
        # target_vector = np.array(self._user_to_vector(target_user)).reshape(1, -1)
        distances, indices = self.model.kneighbors(target_vector)

        group = [target_user]
        group_number = random.randint(1, 1000)

        for i in indices[0]:
            matched_user = self.user_map[i]
            if matched_user.userId != target_user.userId:
                group.append(matched_user)

                if len(group) == 3:
                    for user in group:
                        user.group_number = group_number
                        if user in self.unmatched_users:
                            self.unmatched_users.remove(user)

                    print(f"Matched {[user.name for user in group]} in group {group_number}")
                    return True
        return False
    

def test():
    users = []
    for i in range(9):
        u = User(sub=str(i))
        u.personality = random.random()
        u.preferred_time = random.randint(0, 3)
        u.in_person = random.choice([True, False])
        u.private_space = random.choice([True, False]) if u.in_person else False
        users.append(u)
        print(f"user {i} answers:")
        print(f"Personality: {u.personality}")
        print(f"Preferred study time: {u.preferred_time}")
        print(f"In person or virtual: {u.in_person}")
        if u.in_person:
            print(f"Public or private study area: {u.private_space}")
    client = UserMatchClient(users=users)

    groups_formed = 0
    max_groups = 3

    while groups_formed < max_groups and len(client.unmatched_users) >= 2:
        matched = False
        for user in client.unmatched_users[:]:  
            if client.match(user):
                groups_formed += 1
                matched = True
                break  
        if not matched:
            print("No more possible matches.")
            break

if __name__ == "__main__":
    test()