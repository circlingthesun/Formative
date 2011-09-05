#ifndef INFORM_PARSE
#define INFORM_PARSE

#include <vector>
#include <string>
#include <cv.h>

typedef struct{
    int x;
    int y;
    int w;
    int h;
    int type;
    std::string text;
} retbox;


std::vector <retbox> * parse(cv::Mat & image);

inline double edist(int x1, int y1, int x2, int y2){
    return sqrt(pow(x2-x1,2) + pow(y2-y1,2));
}

inline double edist(int x, int y){
    return sqrt(x*x + y*y);
}

#endif // INFORM_PARSE
