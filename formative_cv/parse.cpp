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

        Rect box1 = boundingRect(Mat(first.points));
        Rect box2 = boundingRect(Mat(second.points));

        long m1 = box1.y*w + box1.x;
        long m2 = box2.y*w + box2.x;
        return m1 < m2;
    }
};


vector <retbox> * parse(Mat & img_rgb){
    unskew(img_rgb);

    // Segment img_rgb
    vector<feature> * result = segment(img_rgb);
    
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

    retbox logo;
    double l_area = 0;

    // Parse segmentation results aka turn into boxes
    for(vector<feature>::iterator it = result->begin(); it != result->end(); it++){
        feature m = *it;  
     
        Rect box = boundingRect(Mat(m.points));

        // Lines
        if( m.ftype == LINE){
            ret->push_back(retbox{box.x, box.y-30, box.width, 30, m.ftype, m.text});
            //line(img_rgb, *(poly.begin()),*(poly.end()-1),cv::Scalar(20),2);
        }
        // Rects
        else if(m.ftype == RECT ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype, m.text});
        }
        // Squares
        else if(m.ftype == SQUARE ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype, m.text});
        }
        // TEXT_BOX
        else if(m.ftype == TEXT ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.ftype, m.text});
        }
        // LOGO
        else if(m.ftype == LOGO){
            double area = fabs(contourArea(Mat(m.points)));
            if(l_area < area){
                logo = retbox{box.x, box.y, box.width, box.height, m.ftype, string("__LOGO__")};
                l_area = area;
            }
        }



    }

    if(l_area != 0)
        ret->push_back(logo);
    
    return ret;
}
