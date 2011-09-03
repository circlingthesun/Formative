#ifndef INFORM_SEGMENT
#define INFORM_SEGMENT

#include <vector>
#include <cv.h>
//#include <highgui.h>
#include <cvaux.h>
#include <math.h>

enum FType {TEXT_BOX, LINE, RECT, SQUARE, FILLED_RECT, FILLED_SQUARE };

typedef struct{
    FType ftype;
    std::vector<cv::Point> points;
} feature;

std::vector<feature> * segment(cv::Mat & image);

#endif // INFORM_SEGMENT
