import os

from setuptools import setup, find_packages, Extension
import commands


def pkgconfig(*packages, **kw):
    '''Parses libraries from pkg config'''
    flag_map = {'-I': 'include_dirs', '-L': 'library_dirs', '-l': 'libraries'}
    for token in commands.getoutput("pkg-config --libs --cflags %s" % ' '.join(packages)).split():
        if flag_map.has_key(token[:2]):
            kw.setdefault(flag_map.get(token[:2]), []).append(token[2:])
        else: # throw others to extra_link_args
            kw.setdefault('extra_link_args', []).append(token)
    for k, v in kw.iteritems(): # remove duplicated
        kw[k] = list(set(v))
    return kw

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

pkgstuff = pkgconfig('opencv')
#pkgstuff['include_dirs'].append('/usr/local/include/tesseract/')
#pkgstuff['libraries'].append('tesseract_api')
pkgstuff['extra_objects'] = [
    '/usr/lib/libtesseract_ccstruct.a',
    '/usr/lib/libtesseract_classify.a',
    '/usr/lib/libtesseract_dict.a',
    '/usr/lib/libtesseract_image.a',
    '/usr/lib/libtesseract_pageseg.a',
    '/usr/lib/libtesseract_training.a',
    '/usr/lib/libtesseract_wordrec.a',
    '/usr/lib/libtesseract_ccutil.a',
    '/usr/lib/libtesseract_cutil.a',
    '/usr/lib/libtesseract_full.a',
    '/usr/lib/libtesseract_main.a',
    '/usr/lib/libtesseract_textord.a',
    '/usr/lib/libtesseract_viewer.a'
]

requires = [
    'pyramid',
    'WebError',
    'mako',
    'pyramid_simpleform',
    'pyramid_mailer',
    'pyramid_beaker',
    'pymongo',
    'webhelpers',
    'pyparsing',
    'PIL',
    'pyDNS',
    ]

formative_cv = Extension(
        'formative_cv',
        [
            'formative_cv/formative_cv.cpp',
            'formative_cv/parse.cpp',
            'formative_cv/segment.cpp',
            'formative_cv/unskew.cpp'
        ],
        **pkgstuff
    )

setup(name='Formative',
      version='0.0',
      description='Formative',
      long_description=README + '\n\n' +  CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pylons",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web pyramid pylons',
      ext_modules = [formative_cv],
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="formative",
      entry_points = """\
      [paste.app_factory]
      main = formative:main
      """,
      paster_plugins=['pyramid'],
      )
