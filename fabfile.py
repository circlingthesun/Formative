from fabric.api import *
from fabric.contrib.console import confirm

env.hosts = ['formative.co.za']
env.user = 'formative'
#env.password = ''

def prepare_deploy():
    #local("./manage.py test my_app")
    local("git add -p && git commit")

def push_remote():
    env.remote_dev = "formative.co.za"
    env.remote_dir = "/home/formative/repo/Formative.git"
    local("git push ssh://%(user)s@%(remote_dev)s/%(remote_dir)s" % env)

def deploy():
    push_remote()
    code_dir = '/home/formative/Formative'
    with cd(code_dir):
        run("git reset --hard HEAD")
        run("git checkout master")
        run("git pull")
        run("git reset --hard HEAD")
        run("source env/bin/activate && python setup.py develop")
        run("touch formative.wsgi")
        
def update():
    env.remote_dev = "formative.co.za"
    env.remote_dir = "/home/formative/repo/Formative.git"
    local("git pull ssh://%(user)s@%(remote_dev)s/%(remote_dir)s" % env)
