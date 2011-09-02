def authenticate(username, password, request):
    """Queries database to see if 
        valid user login credentials.
       Return True or False
    """
    user = request.db.users.find_one({'username': username})
    if user and user['password'] == password:
        return user['username']
    return None

def groupfinder(username, request):
    user = request.db.users.find_one({'username': username})
    
    if user:
        groups = ['group:%s' % val for val in user['group']]
        return groups
    return None
