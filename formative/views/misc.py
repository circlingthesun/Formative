import os

from pyramid.view import view_config
from pyramid.exceptions import NotFound
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound

from pyramid_mailer.message import Message
from pyramid_mailer.message import Attachment

from formencode import Schema, validators
from formencode.schema import SimpleFormValidator

from pyramid_simpleform import Form
from pyramid_simpleform import State
from pyramid_simpleform.renderers import FormRenderer

from pyramid.security import remember
from pyramid.security import forget

from formative.security import authenticate


_here = os.path.dirname(__file__)
_icon = open(os.path.join(_here, '../static', 'favicon.ico')).read()
_fi_response = Response(content_type='image/x-icon', body=_icon)

_robots = open(os.path.join(_here, '../static', 'robots.txt')).read()
_robots_response = Response(content_type='text/plain', body=_robots)

@view_config(name='favicon.ico')
def favicon_view(context, request):
    return _fi_response

@view_config(name='robots.txt')
def robotstxt_view(context, request):
    return _robots_response

'''@view_config(name="googleb9d74e8206a80fc2.html")
def del_this (context, request):
    return Response(content_type='text/plain', body="google-site-verification: googleb9d74e8206a80fc2.html")
'''

class LoginSchema(Schema):
    filter_extra_fields = True
    allow_extra_fields = True
    
    username = validators.String(min=3, max=30, not_empty=True, messages={'empty':'Please enter a username.'})
    password = validators.String(min=3, not_empty=True)

@view_config(context='formative:resources.Root',
                    renderer='/derived/login.mak',
                    name='login')
def login_view(request):
    
    referrer = request.session.get('referrer', '')
    if not referrer:
        referrer = request.referrer
        request.session['referrer'] = referrer
        
    
    login_url = request.resource_url(request.root, 'login')
    if referrer == login_url:
        referrer = '/' # never use the login form itself as referrer

    form = Form(request, schema=LoginSchema)
        
    if form.validate():
        username = authenticate(form.data['username'], form.data['password'], request)
        
        if username:
            headers = remember(request, username)
            request.session.flash('Login successful.', queue='info')
            del request.session['referrer']
            return HTTPFound(location = referrer, headers = headers)
        else:
            request.session.flash('Invalid username or password.', queue='error')  
    
    return {"renderer":FormRenderer(form)}

@view_config(context='formative:resources.Root',
                    name='logout')
def logout_view(request):    
    headers = forget(request)
    request.session.flash( 'You have been logged out!', queue='info')
    return HTTPFound(location = request.resource_url(request.root), headers=headers)

class ContactSchema(Schema):
    """
    Schema for contact form
    """
    filter_extra_fields = True
    allow_extra_fields = True
    
    subject = validators.String(max=300, not_empty=True, messages={'empty':'Subject line cannot be empty.'})
    name = validators.String(max=300, not_empty=True)
    email = validators.Email(not_empty=True, resolve_domain=True)
    message = validators.String(not_empty=True)


@view_config(context='formative:resources.Contact',
                    renderer='/derived/contact.mak')
def contact_view(request):
    form = Form(request, schema=ContactSchema)
        
    if form.validate():
        
        mailer = request.registry['mailer']
        
        office_email = request.registry.settings['office.email'];
        
        from_ = "%s <%s>" % (form.data['name'], form.data['email'])
        
        message = Message(
                  subject=form.data['subject'] + ' [formative.ac.za]',
                  sender=form.data['email'],
                  recipients=[office_email],
                  body=form.data['message'],
                  extra_headers = {"From": from_}
                  )
        
        mailer.send_immediately(message)
        
        request.session.flash('Message sent.', queue='info')

        return HTTPFound(location="/")
    
    if form.errors:
        request.session.flash('There are errors in your form.', queue='error')
    
    return {"renderer":FormRenderer(form)}

@view_config(context='formative:resources.Root',
                    renderer='/derived/home.mak')
def home_view(request):
    return {'project':'formative'}
        
@view_config(context='formative:resources.GridFSName')
def file_view(filew, request):
    afile = request.fs.get_version(filename = filew.name)
    response = Response()
    response.app_iter = afile
    response.status_int = 200
    response.content_type = afile.content_type.encode("utf8", "ignore")
    response.content_length = afile.length
    return response
    
@view_config(context=NotFound, renderer="/derived/error/notfound.mak")
def notfound_view(context, request):
    request.response.status_int = 404
    if request.referrer:
        return {"referrer" : request.referrer}
    else:
        return {"referrer" : "/"}
        
@view_config(context=Forbidden, renderer="/derived/error/forbidden.mak")
def forbidden_view(context, request):
    request.response.status_int = 403
    return {"path" : request.path}
