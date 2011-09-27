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
                    renderer='/derived/myforms.mak',
                    name='myforms',
                    permission='account'
                    )
def myforms(request):
    user_id = authenticated_userid(request)
    forms = request.db.formschemas.find({'user_id':ObjectId(user_id)})
    return {"csrf":request.session.get_csrf_token(), "forms":forms}

@view_config(context='formative:resources.Root',
                    renderer='/derived/formsubmissions.mak',
                    permission='account',
                    name="submissions")
def formsubmissions(request):
    return {"csrf":request.session.get_csrf_token()}


@view_config(
        context='formative:resources.Form',
        renderer='/derived/form.mak'
    )
def view_form(form, request):    

    fields = {}

    # if submitted
    if request.POST:
        items = [f for f in form['items'] if 
                f['type'] =='TEXTBOX' or f['type'] =='CHECKBOX']
        for field in items:
            key = field['name']
            val = request.POST.get(field['name'], "no")
            fields[key] = val

        # Save submission

        submission = {
                'fields': fields,
                'form_id': form['_id'],
                'timestamp': datetime.now()
            }

        request.db.formsubmissions.save(submission)

        # Redirect to submitted page
        return HTTPFound('/submitted')
    
    return {"data":form['items'], "csrf":request.session.get_csrf_token()}

@view_config(
        context='formative:resources.Form',
        renderer='/derived/created.mak',
        name="created"
    )
def created_form(form, request):
    return {"form":form}

@view_config(
        context='formative:resources.Form',
        renderer='/derived/submission_list.mak',
        name="submissions",
        permission='account'
    )
def submission_list(form, request):
    submissions = request.db.formsubmissions\
            .find({'form_id':form['_id']}).sort('timestamp', -1 )
    return {"submissions":submissions, 'form':form}

@view_config(
        context='formative:resources.Form',
        renderer='/derived/submission_list.mak',
        name="csv",
        permission='account'
    )
def submission_csv(form, request):
    submissions = request.db.formsubmissions\
            .find({'form_id':form['_id']}).sort('timestamp', -1 )
    
    items = [ (f['name'], f['label']) for f in form['items'] if 
                f['type'] =='TEXTBOX' or f['type'] =='CHECKBOX']

    header_list = ['"%s"' % f[1] for f in items]
    header_list.insert(0, 'Timestamp')
    headers = ",".join(header_list)

    csv_list = [headers,]
    for sub in submissions:
        item = [sub['timestamp'].strftime('%Y-%m-%d %H:%M')]
        for key, val in items:
            item.append('"%s"' % sub['fields'][key])
        csv_list.append(",".join(item))

    csv = "\n".join(csv_list)

    request.response.body = str(csv)
    request.response.content_type = 'text/csv'
    request.response.content_disposition = 'attachment; filename=%s.csv' % form['label']

    return request.response