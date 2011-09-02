import os
from pymongo.dbref import DBRef
from datetime import datetime
from gridfs import GridFS
from gridfs.grid_file import GridOut

import sys
current_module = sys.modules[__name__]

db_version = 2

def update(db):
    # Initialize things
    current_version = 1
    version_doc = db.admin.find_one({"version": {"$exists": True}})
    if version_doc:
        current_version = version_doc['version']
    else:
       db.admin.save({"version":1})
       
    for ver in xrange(current_version+1, db_version+1):
        update_func = getattr(current_module, 'ver_'+str(ver))
        update_func(db)
          
def ver_2(db):
    # Increase db version number
    db.admin.update({"version": {"$exists": True}}, {"$set": {"version":2}})
    
    # Create a published field in pages
    db.pages.update({}, {"$set": {"published":True, "onfrontpage":True}}, multi=True)
