import base64, os

from pymongo.objectid import ObjectId

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
from pyramid.security import authenticated_userid

from formative.security import authenticate, new_user
from formative.security import change_password, hash_password

class LoginSchema(Schema):
    filter_extra_fields = True
    allow_extra_fields = True
    
    email = validators.Email(not_empty=True,
            messages={'empty':'Please enter a email.'})
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
        user_id = authenticate(form.data['email'], form.data['password'], request.db)
        
        if user_id:
            headers = remember(request, user_id)
            request.session.flash('Login successful.', queue='info')
            del request.session['referrer']
            return HTTPFound(location = referrer, headers = headers)
        else:
            request.session.flash('Invalid email or password.', queue='error')  
    
    return {"renderer":FormRenderer(form)}

@view_config(context='formative:resources.Root',
                    name='logout')
def logout_view(request):    
    headers = forget(request)
    request.session.flash( 'You have been logged out!', queue='info')
    return HTTPFound(location = request.resource_url(request.root), headers=headers)

class ForgotPasswordSchema(Schema):
    filter_extra_fields = True
    allow_extra_fields = True
    
    email = validators.Email(not_empty=True,
            messages={'empty':'Please enter a email.'})

@view_config(context='formative:resources.Root',
                    renderer="/derived/forgot.mak",
                    name='forgot-password')
def forgot_password_view(request):    
    form = Form(request, schema=ForgotPasswordSchema)
    if form.validate():
        user = request.db.users.find_one({'email':form.data['email']})

        if user:

            new_password = base64.b16encode(os.urandom(4))

            mailer = request.registry['mailer']
            office_email = request.registry.settings['office.email']
            from_ = "%s <%s>" % ("Formative", office_email)
            
            body = """Your password was reset to: %s"""\
                    % new_password

            message = Message(
                      subject='Your new password',
                      sender=office_email,
                      recipients=[form.data['email']],
                      body=body,
                      extra_headers = {"From": from_}
                      )
            
            mailer.send_immediately(message)

            change_password(user['email'], new_password, request.db)

            request.session.flash('Your new password was sent to you.',
                queue='info')
        else:
            request.session.flash('This email address is not recognized.',
                    queue='error')
    return {"renderer":FormRenderer(form)}


@view_config(context='formative:resources.Root',
                    renderer="/derived/signup.mak",
                    name='signup')
def signup(request):

    form = Form(request, schema=ForgotPasswordSchema)
        
    if form.validate():
        password = base64.b16encode(os.urandom(4))
        user_id = new_user(form.data['email'], password,
                request.db)
        
        # if user was created
        if user_id:
            headers = remember(request, user_id)


            mailer = request.registry['mailer']
            office_email = request.registry.settings['office.email']
            from_ = "%s <%s>" % ("Formative", office_email)
            
            body = """Thank your for signing up. Your password is: %s"""\
                    % password

            message = Message(
                      subject='Account created',
                      sender=office_email,
                      recipients=[form.data['email']],
                      body=body,
                      extra_headers = {"From": from_}
                      )
            
            mailer.send_immediately(message)

            request.session.flash('Signup successful.', queue='info')
            return HTTPFound(location = '/', headers = headers)
        else:
            request.session.flash(
                    '"%s" is already registered.' % form.data['email'],
                    queue='error'
                    )  
    
    return {"renderer":FormRenderer(form)}

@view_config(context='formative:resources.Root',
                    renderer='json',
                    xhr=True,
                    name='signup')
def ajax_signup(request):

    email = None
    try:
        email = validators.Email().to_python(request.POST['email'])
    except Exception as e:
        return {'success':False, 'error':'Invalid email address'}

    password = base64.b16encode(os.urandom(4))
    user_id = new_user(email, password,
            request.db)
     
    # if user was created   
    if user_id:
        headers = remember(request, user_id)
        request.response.headerlist.extend(headers)

        mailer = request.registry['mailer']
        office_email = request.registry.settings['office.email']
        from_ = "%s <%s>" % ("Formative", office_email)
        
        body = """Thank your for signing up. Your password is: %s"""\
                % password

        message = Message(
                  subject='Account created',
                  sender=office_email,
                  recipients=[email],
                  body=body,
                  extra_headers = {"From": from_}
                  )
        mailer.send_immediately(message)
    else:
        return {
            "success": False,
            "error": '"%s" is already registered.' % email
        }
                    
    return {"success":True}


class AccountSchema(Schema):

    def validate_email(value_dict, state, validator):
        account = state.db.users.find_one({'email' : value_dict['email']})

        if account and str(account['user_id']) != state.user_id:
            return {'email': '"%s" belongs to another account' % value_dict['email']} 
        
        

    chained_validators = [SimpleFormValidator(validate_email)]

    filter_extra_fields = True
    allow_extra_fields = True

    email = validators.Email(not_empty=True,
            messages={'empty':'Please enter a email.'})
    password = validators.String(min=3, not_empty=False)

@view_config(context='formative:resources.Account',
                    renderer="/derived/account.mak",
                    permission='edit'
                    )
def account(user, request):

    form = Form(request, schema=AccountSchema,
            state=State(db=request.db, user_id=authenticated_userid(request))
            )

    if form.validate():
        body = "Thank your account has been updated.\n"

        if form.data['password']:
            body = body + "Your new password is: %s" % form.data['password']
            password_hash, salt = hash_password(form.data['password'])
            user['password_hash'] = password_hash
            user['salt'] = salt

        if form.data['email'] and user['email'] != form.data['email']:
            body = body + "Your email has changed from %s to %s\n"\
                % (user['email'], form.data['email'])
            user['email'] = form.data['email']

        mailer = request.registry['mailer']
        office_email = request.registry.settings['office.email']
        from_ = "%s <%s>" % ("Formative", office_email)
        message = Message(
                  subject='Account modified',
                  sender=office_email,
                  recipients=[user['email']],
                  body=body,
                  extra_headers = {"From": from_}
                  )
        
        mailer.send_immediately(message)

        request.session.flash('Account information changed.', queue='info')
    
    # Fill in the users email
    if 'email' not in form.data:
        form.data['email'] = user['email'] 

    return {"renderer":FormRenderer(form)}