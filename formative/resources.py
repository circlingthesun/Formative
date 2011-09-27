from pymongo.objectid import ObjectId

from pyramid.security import Allow, Deny, DENY_ALL, Everyone, Authenticated
from pyramid.security import authenticated_userid

# Return Objects
class Form(dict):
    def __init__(self, a_dict):
        if not a_dict:
            raise KeyError 
        super(Form, self).__init__(self)
        self.update(a_dict)
        self.__name__ = None
        self.__parent__ = None


class Account(dict):
    def __init__(self, request):
        user_id = authenticated_userid(request)

        if not user_id:
            raise KeyError
        
        super(Account, self).__init__(self)

        user = request.db.users.find_one(ObjectId(user_id))
        self.update(user)
        print user
        self.__acl__ = [
                (Allow, 'group:admin', 'view'),
                (Allow, user_id, 'edit'),
                DENY_ALL
        ]
                
        self.__name__ = None
        self.__parent__ = None 

class Contact(object):
    def __init__(self, request):
        self.__name__ = None
        self.__parent__ = None

class Forms(object):
    def __init__(self, request):
        self.collection = request.db.formschemas
        self.request = request
    
    def __getitem__(self, path):
        form = Form(self.collection.find_one({"label": path}))
        return _assign(form, path, self)


class Root(object):
    __name__ = None
    __parent__ = None
    __acl__ = [ (Allow, Everyone, 'view'),
                (Allow, Authenticated, 'account'),
                (Allow, 'group:admin', 'edit'),
                DENY_ALL ]

    def __init__(self, request):
        self.children = {
                'form': Forms,
                'account': Account,
                'contact': Contact,
                }
        self.request = request
        
    def __getitem__(self, name):
        next = self.children[name](self.request)
        return _assign(next, name, self)

def _assign(obj, name, parent):
    obj.__name__ = name
    obj.__parent__ = parent
    return obj
    
