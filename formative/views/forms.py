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
from pyramid.security import authenticated_userid

from pyramid_simpleform import Form
from pyramid_simpleform.renderers import FormRenderer
from formencode import Schema

from formative.security import authenticate
from formative.resources import MForm


@view_config(context='formative:resources.Root',
                    renderer='/derived/myforms.mak',
                    name='myforms',
                    permission='account'
                    )
def myforms(request):
    '''Shows all the forms a user has created'''
    user_id = authenticated_userid(request)
    forms = request.db.formschemas.find({'user_id':ObjectId(user_id)})
    return {"csrf":request.session.get_csrf_token(), "forms":forms}

@view_config(context='formative:resources.Root',
                    renderer='/derived/formsubmissions.mak',
                    permission='account',
                    name="submissions")
def formsubmissions(request):
    '''Lists all complted forms'''
    return {"csrf":request.session.get_csrf_token()}


@view_config(
        context='formative:resources.MForm',
        renderer='/derived/m_form.mak'
    )
@view_config(
        context='formative:resources.Form',
        renderer='/derived/form.mak'
    )
def view_form(form, request):    

    fields = {}

    # if submitted
    if request.POST:

        p = request.POST

        # Filter out non fields
        items = [f for f in form['items'] if 
                f['type'] =='TEXTBOX' or f['type'] =='CHECKBOX']

        # Validate textboxes here
        errors = {}

        for f in items:
            if f['type'] != 'TEXTBOX':
                continue;

            if f['not_empty'] and not p[f['name']]:
                errors[f['name']] = "Field cannot be empty"
            elif f['min_len'] != 0 and len(p[f['name']]) < f['min_len']:
                errors[f['name']] = "Too short. Minimum length is %d." % f['min_len']
            elif f['max_len'] != 0 and len(p[f['name']]) > f['max_len']:
                errors[f['name']] = "Too long. Maximum length is %d." % f['max_len']

        
        for field in items:
            key = field['name']
            val = p.get(field['name'], "no")
            fields[key] = val

        if errors:
            return {
                "data":form['items'],
                "errors": errors,
                "filled": fields,
                "csrf":request.session.get_csrf_token()
                }


        # Save submission
        submission = {
                'fields': fields,
                'form_id': form['_id'],
                'timestamp': datetime.now()
            }

        request.db.formsubmissions.save(submission)

        # Redirect to submitted page
        if isinstance(form, MForm):
            return HTTPFound('/m_submitted')
        return HTTPFound('/submitted')
    
    return {
        "data":form['items'],
        "errors": {},
        "filled": {},
        "csrf":request.session.get_csrf_token()
        }

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
    items = [ (f['name'], f['label']) for f in form['items'] if 
                f['type'] =='TEXTBOX' or f['type'] =='CHECKBOX']

    submissions = request.db.formsubmissions\
            .find({'form_id':form['_id']}).sort('timestamp', -1 )
    return {"submissions":submissions, 'form':form, 'items':items}

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


@view_config(context='formative:resources.Form',
                    renderer='/derived/delete.mak',
                    name="del",
                    permission='account')
def paper_del(form, request):
    
    form2 = Form(request, schema=Schema)
    
    if request.POST:
        if 'delete' in request.POST:

            # remove submissions
            for sub in request.db.formsubmissions.find({'form_id':form['_id']}):
                request.db.formsubmissions.remove(sub)

            # remove schema
            request.db.formschemas.remove(form)
                

            request.session.flash('Form deleted.', queue='info')
            return HTTPFound('/myforms')
        elif 'cancel' in request.POST:
            request.session.flash('Paper deletion canceled.', queue='info')
            return HTTPFound('/myforms')
    
    return {'item':form['title'], "renderer":FormRenderer(form2)}


@view_config(
        context='formative:resources.Root',
        renderer='/derived/m_submitted.mak',
        name="m_submitted"
    )
@view_config(
        context='formative:resources.Root',
        renderer='/derived/submitted.mak',
        name="submitted"
    )
def view_submitted(form, request):
    return {}