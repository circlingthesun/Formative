from os import urandom
from hashlib import sha1
import base64
from pymongo.objectid import ObjectId

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
            return str(user['_id'])

    return None

def groupfinder(_id, request):
    """Determines what groups the user belongs to"""
    user = request.db.users.find_one(ObjectId(_id))

    if user:
        groups = ['group:%s' % val for val in user['groups']]
        return groups
    return None

def new_user(email, password, db, groups=['standard']):
    """Creates a new user"""
    existing_account = db.users.find_one({'email':email})

    if existing_account:
        return False

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
    
    return str(db.users.save(user))

def change_password(email, password, db):
    """Creates a new user"""
    existing_account = db.users.find_one({'email':email})

    if not existing_account:
        return False

    salt = base64.b64encode(urandom(8))
    m = sha1()
    m.update(password)
    m.update(salt)
    password_hash = base64.b64encode(m.digest())

    existing_account['password_hash'] = password_hash
    existing_account['salt'] = salt
    
    db.users.save(existing_account)

    return True

def hash_password(password):
    salt = base64.b64encode(urandom(8))
    m = sha1()
    m.update(password)
    m.update(salt)
    password_hash = base64.b64encode(m.digest())
    return (password_hash, salt)