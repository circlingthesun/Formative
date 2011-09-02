import os
from pymongo.dbref import DBRef
from datetime import datetime
from gridfs import GridFS
from gridfs.grid_file import GridOut
    
def initialize_mongo(db):
    '''Creates indexes if they are not defined '''
        
    fs = GridFS(db)
        
    if (db.admin.find_one({"initialized": True}) != None):
        return

       
    # Insert users
    
    admin = {
        'username':'webmaster',
        'password':'seven11',
        'group':['admin'],
    }
    
    db.users.insert(admin)
    
    admin = {
        'username':'bennie',
        'password':'tyson411',
        'group':['admin'],
    }
    
    db.users.insert(admin)
    
    admin = {
        'username':'pgsmit',
        'password':'cresent',
        'group':['admin'],
    }
    
    db.users.insert(admin)
    
    admin = {
        'username':'lorraine',
        'password':'cresent',
        'group':['admin'],
    }
    
    db.users.insert(admin)
    
    # Insert settings
    settings = {
        'name':'applications',
        'form_title': 'Applications 2012',
        'instructions': """<h3>Instructions</h3>

<ul>
        <li>Complete the form below.</li>
        <li>Wait for the confirmation email.</li>
        <li>Mail the following certified documents:
            <ul>
            <li>
            A copy of your Grade 11 report,
            </li>
            <li>
            or a copy of your Senior Certificate if you have already matriculated.
            </li>
            <li>
            A copy of the identity page of your Green Identity Document
            </li>
            </ul>
        </li>
        <li>
        Pay the non-refundable application fee of R450.00 via EFT into the following account:<br>
        ABSA BANK DURBANVILLE BRANCH CODE: 334810 ACCOUNT NO. 1006193931.
        </li>
        <li>
        Email or fax us your proof of payment to info@durbanvillecollege.co.za or 021 976-1721
        </li>
        <li>
        A confirmation email will be sent once payment was recieved.
        </li>
        <li>
        Once your application has been processed you will be notified by phone or email.
        </li>
</ul>""",
        'confirmation_email_subject':'Application submitted',
        'confirmation_email_body': """Hi %(name)s,

Your application to enrol for %(course)s during %(intake)s has been succesfully submitted. Please make sure you submit the required documentation.

Kind Regards
%(from)s""",
        
    }
    
    db.settings.insert(settings)
        
    
    db.admin.insert({"initialized": True})
