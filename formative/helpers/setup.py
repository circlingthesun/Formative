import os
from pymongo.dbref import DBRef
from datetime import datetime
from formative.security import new_user
    
def initialize_mongo(db):
    '''Creates indexes if they are not defined '''
                
    if (db.admin.find_one({"initialized": True}) != None):
        return

       
    # Create users
    new_user('circlingthesun@gmail.com', 'letmein', db, ['standard', 'admin'])

        
    
    db.admin.insert({"initialized": True})
