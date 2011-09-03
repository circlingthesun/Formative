#include <queue>
#include <algorithm>
#include <cvaux.h>
//#include <highgui.h>
#include "unskew.h"
#include "segment.h"
#include "parse.h"

using namespace std;
using namespace cv;

// Compares features

class feature_compare{
    public:
    int w, h;
    feature_compare(int w, int h): w(w), h(h){}
    
    bool operator ()(const feature & first, const feature & second) const{
        try{
            Rect box1 = boundingRect(Mat(first.points));
            Rect box2 = boundingRect(Mat(second.points));

            long m1 = box1.y*w + box1.x;
            long m2 = box2.y*w + box2.x;
            return m1 < m2;
        }
        catch(cv::Exception e){
            //printf("EXCEPTION compare: %s\n", e.what());
            return false;
        }  
    }
};


vector <retbox> * parse(Mat & img_rgb){
    printf("parse\n");
    unskew(img_rgb);

    // Segment img_rgb
    vector<feature> * result = segment(img_rgb);


    printf("Segment resturns: %d\n", result->size());
    
    // Sort results from top left to bottom right
    sort(result->begin(), result->end(), feature_compare(img_rgb.rows, img_rgb.cols));
    
    
    // Set up heuristic variables
    double dist_weight = 0.2;
    double logo_rank = 0;
    CvRect logo_box;
    int m_y = img_rgb.rows/2;
    int m_x = img_rgb.cols/2;
    double max_dist = edist(m_x, m_y);
        
    vector <retbox> * ret = new vector<retbox>();

    // Parse segmentation results aka turn into boxes
    for(vector<feature>::iterator it = result->begin(); it != result->end(); it++){
        feature m = *it;  
        Rect box;      

        try{
            box = boundingRect(Mat(m.points));
        }
        catch(cv::Exception e){
            //printf("EXCEPTION parse: %s\n", e.what());
            Mat points = Mat(m.points);
            if (points.isContinuous())
                printf("points.isContinuous()\n");
            if (points.depth() == CV_32S)
                printf("points.depth() == CV_32S\n");
            if (points.depth() == CV_32F)
                printf("points.depth() == CV_32F\n");
            if (points.rows == 1)
                printf("points.rows == 1\n");
            if (points.channels() == 2)
                printf("points.channels() == 2\n");
            if (points.cols*points.channels() == 2)
                printf("points.cols*points.channels() == 2\n");
            for (int i = 0; i < m.points.size(); i++){
                printf("(%d, %d) ", m.points[i].x, m.points[i].y);
            }
            printf(" - size: %d\n", m.points.size());

            continue; // HACK!!
        }


        // Lines
        if( m.ftype == LINE){
            ret->push_back(retbox{box.x, box.y-30, box.width, 30, m.ftype});
            //line(img_rgb, *(poly.begin()),*(poly.end()-1),cv::Scalar(20),2);

        }
        // Rects
        else if(m.ftype == RECT ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype});
        }
        // Squares
        else if(m.ftype == SQUARE ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype});
        }
        // TEXT_BOX
        /*else if(m.ftype == TEXT_BOX ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype});
        }*/
    }
    
    printf("parse done\n");
    return ret;
}
