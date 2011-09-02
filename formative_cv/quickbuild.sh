if [ "$3" == "--fix" ]; then
    sed -i 's/“/"/g' $1
    sed -i 's/”/"/g' $1
    
    astyle --brackets=attach --indent=spaces=4 $1.c
fi
g++  $1 -o $2 -ltesseract_api  -L/usr/local/lib/ -I/usr/local/include/tesseract/ `pkg-config --cflags opencv --libs opencv`
