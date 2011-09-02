import os

from setuptools import setup, find_packages, Extension

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

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
        include_dirs = [
            '/usr/include/opencv',
            '/usr/local/include/tesseract/',
            'formative_cv/'
        ],
        libraries = [
            'tesseract_api',
            'ml',
            'cvaux',
            'highgui',
            'cv',
            'cxcore'
        ],
        library_dirs = ['/usr/local/lib'],
        sources = [
            'formative_cv/formative_cv.cpp',
            'formative_cv/parse.cpp',
            'formative_cv/segment.cpp',
            'formative_cv/unskew.cpp'
        ]
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

