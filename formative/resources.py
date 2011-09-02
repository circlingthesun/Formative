from pyramid.security import Allow, Deny, DENY_ALL, Everyone, Authenticated
# Return Objects

class Form(dict):
    def __init__(self, a_dict):
        if not a_dict:
            raise KeyError 
        super(Form, self).__init__(self)
        self.update(a_dict)
        self.__name__ = None
        self.__parent__ = None
        
class Page(dict):
    def __init__(self, a_dict):
        if not a_dict:
            raise KeyError
        super(Page, self).__init__(self)
        self.update(a_dict)        
        
        if not self['published']:
            
            self.__acl__ = [ (Allow, 'group:admin', 'view'),
                (Allow, 'group:admin', 'edit'),
                DENY_ALL ]
                
        self.__name__ = None
        self.__parent__ = None
    
class GridFSName(object):
    def __init__(self, name):
        self.name = name
        self.__name__ = None
        self.__parent__ = None

class Contact(object):
    def __init__(self, request):
        self.__name__ = None
        self.__parent__ = None

# Traversals


class Forms(object):
    def __init__(self, request):
        self.collection = request.db.forms
        self.request = request
    
    def __getitem__(self, path):
        story = Form(self.collection.find_one({"name": path}))
        return _assign(story, path, self)

class Pages(object):
    def __init__(self, request):
        self.collection = request.db.pages
        self.request = request
    
    def __getitem__(self, path):
        page = Page(self.collection.find_one({"name": path}))
        return _assign(page, path, self)

class Files(object):
    def __init__(self, request):
        self.fs = request.fs
        self.request = request
    
    def __getitem__(self, name):
        if not self.fs.exists(filename = name):
            return KeyError
        afile = GridFSName(name)
        return _assign(afile, name, self)

class Root(object):
    __name__ = None
    __parent__ = None
    __acl__ = [ (Allow, Everyone, 'view'),
                (Allow, 'group:admin', 'edit'),
                DENY_ALL ]

    def __init__(self, request):
        self.children = {
                'forms': Forms,
                'pages': Pages,
                'file': Files,
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
    
