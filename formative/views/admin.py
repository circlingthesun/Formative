import json
import base64
from datetime import datetime

from pyramid.view import view_config
from pyramid.exceptions import NotFound
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest

from pyramid_mailer.message import Message
from pyramid_mailer.message import Attachment

from pymongo.objectid import ObjectId

from pyramid.security import remember
from pyramid.security import forget

from formative.security import authenticate
from pyramid.security import authenticated_userid

@view_config(context='formative:resources.Root',
                    renderer='/derived/list_forms.mak',
                    name='myforms',
                    permission='account'
                    )
def list_forms(request):
    user_id = authenticated_userid(request)
    forms = request.db.formschemas.find({'user_id':ObjectId(user_id)})
    return {"csrf":request.session.get_csrf_token(), "forms":forms}

@view_config(context='formative:resources.Root',
                    renderer='/derived/list_submissions.mak',
                    permission='account',
                    name="submissions")
def list_submissions(request):
    return {"csrf":request.session.get_csrf_token()}