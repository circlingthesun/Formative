#include "parse.h"
#include <algorithm>
#include <vector>
#include <cv.h>
//#include <highgui.h>
#include <cvaux.h>
#include "unskew.h"
#include <queue>
#include "segment.h"

using namespace std;

// Compares markers

class marker_compare{
    public:
    int w, h;
    marker_compare(int w, int h): w(w), h(h){}
    
    bool operator ()(const marker & first, const marker & second) const{
        try{
            CvRect box1 = cvBoundingRect(first.poly, 1 /*Update */);
            CvRect box2 = cvBoundingRect(second.poly, 1 /*Update */);
            //double dist1 = edist(box1.x, box1.y);
            //double dist2 = edist(box2.x, box2.y);
            long m1 = box1.y*w + box1.x;
            long m2 = box2.y*w + box2.x;
            return m1 < m2;
        }
        catch(cv::Exception e){
            return false;
        }  
    }
};


vector <retbox> * parse(IplImage* image){

    unskew(image);
    
    // Initialize
    IplImage * tmp = cvCreateImage( cvGetSize(image), IPL_DEPTH_8U, 3 );
    IplImage * tmp2 = cvCreateImage( cvGetSize(image), IPL_DEPTH_8U, 1 );
    CvMemStorage* storage = cvCreateMemStorage(0);
    cvClearMemStorage( storage );
    
    // Copy image to temporary structures
    cvConvertImage(image, tmp, 0);
    cvConvertImage(image, tmp2, 0);
    
    // Segment image
    vector<marker> * result = segment(tmp2, storage);
    
    printf("111\n");
    
    // Sort results from top left to bottom right
    sort(result->begin(), result->end(), marker_compare(image->width, image->height));
    
    
    
    // Set up heuristic variables
    double dist_weight = 0.2;
    double logo_rank = 0;
    CvRect logo_box;
    int m_y = image->height/2;
    int m_x = image->width/2;
    double max_dist = edist(m_x, m_y);
        
    vector <retbox> * ret = new vector<retbox>();

    // Parse segmentation results
    for(vector<marker>::iterator it = result->begin(); it != result->end(); it++){
        marker m= *it;  
        CvRect box;      

        try{
            box = cvBoundingRect(m.poly, 1 /*Update */);
        }
        catch(cv::Exception e){
            continue;
        }
        
        // Lines
        if( m.type == 1){
            ret->push_back(retbox{box.x, box.y-30, box.width, 30, m.type});
            //cvLine(tmp, *(CvPoint*)cvGetSeqElem(m.poly, 0), *(CvPoint*)cvGetSeqElem(m.poly, 1), cvScalar(0,0,255));
        }
        // Rects
        else if(m.type == 2 ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.type});
            /*cvDrawContours(
                tmp,
                m.poly,
                cvScalar(255, 0, 0),
                cvScalar(255, 0, 0),
                0,
                1,
                8
            );*/
            
            
        }
        // Squares
        else if(m.type == 3 ){
            ret->push_back(retbox{box.x, box.y, box.width, box.height, m.type});
            /*cvDrawContours(
                tmp,
                m.poly,
                cvScalar(255, 255, 0),
                cvScalar(255, 255, 0),
                0,
                1,
                8
            );*/
        }
        
        // Other
        /*else if( m.type == 0 ){
            continue;
           // CvRect box = cvBoundingRect(m.poly, 1 ); //Update = 1 
        
            int x1 = box.x, y1 = box.y;
            int x2 = box.x + box.width, y2 = box.y + box.height;
            
            // Track last center
            int c_x = x1 + box.width/2;
            int c_y = y2 + box.height/2;
            
            // Distance update rate
            double u_rate = 0.5;
            double dist_error_margin = 1.2;
            double mean_dist = -1;
            
            // Iterate over all consequtive text boxes
            for(vector<marker>::iterator it2(it+1); it2 != result->end(); it2++){
                // Stop if other type is encountered
                if((*it2).type != 0){
                    it = it2-1;
                    break;
                }

                CvRect box = cvBoundingRect((*it2).poly, 1 );//Update 
                
                // Save previous center
                int c_x2 = c_x;
                int c_y2 = c_y;
                
                // Track last center
                int c_x = x1 + box.width/2;
                int c_y = y2 + box.height/2;
                
                // Calc distance from last box
                double dist = edist(c_x, c_y, c_x2, c_y2);
                                
                // Check that the next box is within range
                if(mean_dist != -1 && dist > mean_dist*dist_error_margin){
                    it = it2-1;
                    break;
                }
                
                // Update mean distance
                if(mean_dist < 0) mean_dist = dist;
                else mean_dist = mean_dist*(1-u_rate) + dist*u_rate;
                
                if(mean_dist < 1) mean_dist = 1;
                
                // Expand box
                if(box.x < x1) x1 = box.x;
                if(box.y < y1) y1 = box.y;
                if(box.x + box.width > x2) x2 = box.x + box.width;
                if(box.y + box.height > y2) y2 = box.y + box.height;
                
            }
            
            
            
            box.x = x1;
            box.y = y1;
            box.width = x2-x1;
            box.height = y2-y1;

            cvRectangle (
                    tmp,
                    cvPoint(box.x,box.y),
                    cvPoint(box.x+box.width,box.y+box.height),
                    cvScalar(0,255,0),
                    1, //thinkness
                    8 // Type
            );
            
            // Attempt to find logo
            double area = fabs(cvContourArea(m.poly));
            double max_area = (image->height*image->width)/9;
            double dist = edist((m_x-box.x)/2, (m_y-box.y)/2);
            double rank = dist*dist_weight + (1-dist_weight)*sqrt(area);
            if (rank > logo_rank && area < max_area){
                logo_rank = rank;
                logo_box = box;
            }
                   
        }*/
        
    }
    
    // Draw rectangle around what we think is the logo
    /*cvRectangle (
            tmp,
            cvPoint(logo_box.x,logo_box.y),
            cvPoint(logo_box.x+logo_box.width,logo_box.y+logo_box.height),
            cvScalar(255, 0,255),
            2, //thinkness
            8 // Type
    );*/

    cvReleaseImage(&tmp2);

    return ret;

}
