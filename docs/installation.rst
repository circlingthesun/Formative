Installing Formative
====================

Formative is a web application built ontop of the Pyramid 1.2 Python web framework. Formative employs OpenCV and the Tesseract 3 OCR engine for backend processor intensive tasks. A Python plugin was written to interface with these libraries.

To install formative you will need to download OpenCV 2.3 and Tesseract OCR 3.

http://tesseract-ocr.googlecode.com/files/tesseract-3.00.tar.gz

http://code.google.com/p/tesseract-ocr/downloads/detail?name=eng.traineddata.gz&can=2&q=

http://sourceforge.net/projects/opencvlibrary/

Tesseract 3 depends on the leptonica library which you might have to install first if you do not already have it.

http://code.google.com/p/leptonica/

You will need to install CMake to install OpenCV. There are no debian packages currently availible for OpenCV 2.3. Earlier versions contain a small bug which causes index out of bound errors during contour detection that my crash Formative at times.

``cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local -D BUILD_PYTHON_SUPPORT=OFF -D WITH_GTK=OFF -D WITH_FFMPEG=OFF -D WITH_JASPER=OFF .``

``make``
``sudo make install``

``sudo cp unix-install/opencv.pc /usr/share/pkgconfig/``

Formative also relies on the Python Image Library. In order to install this with png support you will need zlib.

``sudo apt-get install zlib1g-dev``

On Ubuntu 11.10 and below you will need to run:

``sudo ln -s /usr/lib/x86_64-linux-gnu/libz.so /usr/lib/``

or the linker will fail to find zlib.

Make sure you have the python development headers installed.

``sudo apt-get install python-dev``

You also need the boost libraries.

All other the Python dependencies should work out of the box.

It is recommended that the application be run in a virtual python environment.

``sudo apt-get install python-virtualenv``

``virtualenv env --no-site-packages``

``sudo apt-get install mongodb``

Once all dependencies have been installed Formative can be compiled and installed via ``python setup.py develop``

Once the has completed the server can be started with ``paster serve development.ini --reload`` or ``paster serve production.ini --reload``

A formative.wsgi file is provided for those using other webservers that support WSGI such as nginx or Apache.


svn checkout http://pyqrnative.googlecode.com/svn/trunk/ pyqrnative-read-only

