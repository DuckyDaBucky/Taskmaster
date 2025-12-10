from datetime import datetime
from supabase_client import get_supabase


class User:
    def __init__(self, userId: str="", client=None, userObject: dict=None):
        if userId and not userObject:
            # Fetch from Supabase
            supabase = get_supabase()
            response = supabase.table('users').select('*').eq('id', userId).single().execute()
            if response.data:
                userObject = response.data
            else:
                raise ValueError(f"User {userId} not found")

        # Map Supabase format to User object
        self.userId = userObject.get("id") or userObject.get("_id")
        # Convert Supabase preferences format
        self.preferences = {
            'personality': userObject.get("personality", 0.5),
            'time': userObject.get("time_preference", 0),
            'inPerson': userObject.get("in_person", 0),
            'privateSpace': userObject.get("private_space", 0),
        } if not userObject.get("preferences") else userObject.get("preferences")
        self.name = userObject.get("user_name") or userObject.get("userName") or userObject.get("name")
        self.points = userObject.get("points") if userObject.get("points") else 0
        self.streak = userObject.get("streak") if userObject.get("streak") else 0
        self.last_task_date = userObject.get("last_task_date") or userObject.get("lastTaskDate")
        if self.last_task_date and isinstance(self.last_task_date, str):
            try:
                self.last_task_date = datetime.fromisoformat(self.last_task_date.replace('Z', '+00:00'))
            except:
                self.last_task_date = None
        self.group_number = userObject.get("group_number") or userObject.get("groupNumber") or 0
        self.level = userObject.get("level") if userObject.get("level") else 1

    def streak_update(self, client=None):
        # Update streak in Supabase
        supabase = get_supabase()
        update_data = {
            'streak': self.streak,
        }
        if self.last_task_date:
            update_data['last_task_date'] = self.last_task_date.isoformat()
        
        supabase.table('users').update(update_data).eq('id', self.userId).execute()

    def to_vector(self):
        if not self.preferences:
            return [0.5, 0, 0, -1]  # Default values
        
        in_person = self.preferences.get('inPerson', 0) or self.preferences.get('in_person', 0)
        
        return [
            self.preferences.get('personality', 0.5),
            self.preferences.get('time', 0) or self.preferences.get('time_preference', 0),
            int(in_person),
            int(self.preferences.get('privateSpace', 0) or self.preferences.get('private_space', 0)) if in_person else -1,
        ]
