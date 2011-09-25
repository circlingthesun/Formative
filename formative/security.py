from os import urandom
from hashlib import sha1
import base64

def authenticate(email, password, db):
    """Checks user credetials"""
    user = db.users.find_one({'email': email})
    if user:

        salt = base64.b64encode(urandom(8))
        m = sha1()
        m.update(password)
        m.update(user['salt'])
        password_hash = base64.b64encode(m.digest())

        if  user['password_hash'] == password_hash:
            return user['email']

    return None

def groupfinder(email, request):
    """Determines what groups the user belongs to"""
    user = request.db.users.find_one({'email': email})

    if user:
        groups = ['group:%s' % val for val in user['groups']]
        return groups
    return None

def new_user(email, password, db, groups=['standard']):
    """Creates a new user"""
    existing_account = db.users.find_one({'email':email})

    salt = base64.b64encode(urandom(8))
    m = sha1()
    m.update(password)
    m.update(salt)
    password_hash = base64.b64encode(m.digest())

    user = {
        'email':email,
        'password_hash': password_hash,
        'salt': salt,
        'groups': groups,
    }
    db.users.save(user)