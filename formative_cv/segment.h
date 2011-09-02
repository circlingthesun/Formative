#ifndef INFORM_SEGMENT
#define INFORM_SEGMENT

#include <vector>
#include <cv.h>
#include <highgui.h>
#include <cvaux.h>
#include <math.h>

typedef struct{
    int type; // 0 = ocr bounding box, 1 = line, 2 = rect, square = 3
              // filled rect = 4, filled square = 6
    CvSeq * poly;
} marker;

std::vector<marker> * segment(IplImage* image, CvMemStorage* storage);

#endif // INFORM_SEGMENT
