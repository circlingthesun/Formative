from pyramid.config import Configurator
from pyramid.events import subscriber
from pyramid.events import NewRequest
from pyramid.events import BeforeRender
from pyramid.httpexceptions import HTTPForbidden
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
import pyramid_beaker

from formative.resources import Root
from formative.helpers.setup import initialize_mongo
from formative.helpers import helpers, dbupdates
from formative.security import groupfinder

from gridfs import GridFS
import pymongo
from pymongo.son_manipulator import AutoReference, NamespaceInjector

from pyramid_mailer.mailer import Mailer

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    
    # Authentication & authorisation
    authentication_policy = AuthTktAuthenticationPolicy('seekrit', callback=groupfinder)
    authorization_policy = ACLAuthorizationPolicy()
    
    # Sessions
    session_factory = pyramid_beaker.session_factory_from_settings(settings)
    
    config = Configurator(
            root_factory=Root,
            settings=settings,
            authentication_policy=authentication_policy,
            authorization_policy=authorization_policy,
            session_factory=session_factory,
            )

    # Add helpers to render
    config.add_subscriber(add_renderer_globals, BeforeRender)

    # MongoDB related
    db_uri = settings['db_uri']
    conn = pymongo.Connection(db_uri)    
    config.registry.settings['db_conn'] = conn
    config.add_subscriber(add_mongo_db, NewRequest)
    
    # Delete if running in development mode
    if settings['db.reset'] == 'true':
        conn.drop_database(settings['db_name'])
    
    initialize_mongo(conn[settings['db_name']])
    dbupdates.update(conn[settings['db_name']])
    
    # Mailer
    config.include('pyramid_mailer')
    config.registry['mailer'] = Mailer.from_settings(settings)
    
    # CSRF check
    config.add_subscriber(csrf_validation, NewRequest)
    
    config.add_static_view('static', 'formative:static')
    config.scan()
    return config.make_wsgi_app()

def csrf_validation(event):
    if event.request.method == "POST":
        token = event.request.POST.get("_csrf")
        if token is None or token != event.request.session.get_csrf_token():
            raise HTTPForbidden, "CSRF token is missing or invalid"

def add_renderer_globals(event):
   event['h'] = helpers

def add_mongo_db(event):
    '''Adds MongoDB objects to request'''
    settings = event.request.registry.settings
    db = settings['db_conn'][settings['db_name']]
    db.add_son_manipulator(NamespaceInjector())
    db.add_son_manipulator(AutoReference(db))
    event.request.db = db
    event.request.fs = GridFS(db)
