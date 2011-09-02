#include "segment.h"

using namespace std;

inline void scale_seq(CvSeq * seq, double scale){
    for( int i=0; i< seq->total; ++i ) {
        CvPoint* p = (CvPoint*)cvGetSeqElem ( seq, i );
        p->x = p->x*scale;
        p->y = p->y*scale;
    }
}

// Traverse contour tree and mark relevant boxess
bool get_box_lines(CvSeq* contours, int width, int height, double scale_factor, vector<marker> & result, CvMemStorage* storage, int parent_type = 2){
    bool is_this_good = false;
    
    // Use heuristics
    int minimum_line_len = width/30;
    int min_box_size = pow((height+width)/120, 2);
    
    // Traverse countours at same level
    while(contours){
        // Find current element
        marker element;
        
        scale_seq(contours, 1/scale_factor);
        
        //printf("perim: %f\n", cvContourPerimeter(contours)*0.02);
        
        CvSeq * polys = cvApproxPoly(contours, sizeof(CvContour), storage, CV_POLY_APPROX_DP, cvContourPerimeter(contours)*0.02, 0); // Explain algorith why approximation of ..
        if(polys->total==4 && fabs(cvContourArea(polys, CV_WHOLE_SEQ)) > min_box_size){
            // Check for square
            CvPoint *pt[4];
            for(int i=0;i<4;i++)
                pt[i] = (CvPoint*)cvGetSeqElem(polys, i);
            
            // Length of the 1st two lines. Assumes paralellogram
            float line1 = sqrt( (float)pow((*pt[0]).y-(*pt[1]).y, 2) + (float)pow((*pt[0]).x-(*pt[1]).x, 2) ); 
            float line2 = sqrt( (float)pow((*pt[1]).y-(*pt[2]).y, 2) + (float)pow((*pt[1]).x-(*pt[2]).x, 2) ); 
            
            // Make line 1 the biggest
            if(line2>line1){
                float tmpline = line1;
                line1 = line2;
                line2 = tmpline;
            }
            
            float ratio = line1/line2;
            float delta = 0.4;
            
            if((ratio - 1) < delta){
                element.type = 3;
            }
            else{
                element.type = 2;
            }
            element.poly = polys;
            
            is_this_good = true;
        }
        
        else if(polys->total==2){

            CvPoint *pt[2];
            for(int i=0;i<2;i++)
                pt[i] = (CvPoint*)cvGetSeqElem(polys, i);
 
            float gradient = fabs(((*pt[0]).y-(*pt[1]).y)/(float)((*pt[0]).x-(*pt[1]).x)); // Gradient of line
            float length = sqrt( (float)pow((*pt[0]).y-(*pt[1]).y, 2) + (float)pow((*pt[0]).x-(*pt[1]).x, 2) ); // Length of line
 
            if(gradient < 0.01 && length > minimum_line_len){ // Should prolly set heuristic
                element.type = 1;
                element.poly = polys;
                is_this_good = true;
            }
        }
        
        else if(parent_type != 0){ // Push things that can be ocred
            element.type = 0; // ocr
            element.poly = polys;
        }
        else{ // Dont recurse into a possible character object
            contours = contours->h_next;
            continue;
        }
        
        bool is_inner_good = false; // Good meaning does it contains a line or box
        bool inner_empty = true;
        // Recurse on the sub contours
        if (contours->v_next){
            
            vector<marker> recurse_result;
            if(result.size())
                inner_empty = false;
            is_inner_good = get_box_lines(contours->v_next, width, height, scale_factor, recurse_result, storage, element.type);
            result.reserve(result.size() + distance(recurse_result.begin(),recurse_result.end()));
            result.insert(result.end(),recurse_result.begin(),recurse_result.end());
        }
        
        // Push the current contour only if the inner contours does not contain a line or square
        if(!is_inner_good){
            if(!inner_empty)
                element.type = element.type * 2;
            result.push_back(element);
        }
        
        contours = contours->h_next;
    }    

    return is_this_good;
}

vector<marker> * segment(IplImage* image, CvMemStorage* storage){
        
    // Reference image scale
    int ref_x = 1262;
    int ref_y = 1772;
    int ref_res = ref_x*ref_y;
    
    double scale_factor =  sqrt(ref_res) /(double)sqrt(image->width*image->height);
    int width = image->width*scale_factor;
    int height = image->height*scale_factor;
    
    // Create copies to work with
    IplImage* copy_image = cvCreateImage(cvSize(width,height), IPL_DEPTH_8U, 1);
    IplImage* copy_image2 = cvCreateImage(cvSize(width,height), IPL_DEPTH_8U, 1);
        

    cvResize(image, copy_image, CV_INTER_AREA);
        
    // Smooth/despeckle image    
    
    int avg_pix = cvSum(copy_image).val[0]/(double)(width*height);
    int smooth_box = 1;
    if(avg_pix < 190){
        smooth_box = 7;
    }
        
    cvSmooth(copy_image, copy_image2, CV_GAUSSIAN , smooth_box , smooth_box); // Writeup: explain different choices
    
    // Clean up via addaptive threshold
    cvAdaptiveThreshold( copy_image2, copy_image, 255, CV_ADAPTIVE_THRESH_MEAN_C,
            CV_THRESH_BINARY, 7, 20 ); // How did I get to 20?
                      
    // Dilate with custom kernel
    //IplConvKernel* kernel = cvCreateStructuringElementEx( 3, 3, 1, 1, CV_SHAPE_CROSS, NULL );
    //IplConvKernel* kernel = cvCreateStructuringElementEx( 3, 1, 1, 0, CV_SHAPE_RECT, NULL );
    //cvErode(copy_image, copy_image2, kernel, 1);
    //cvReleaseStructuringElement(&kernel);
    
    cvReleaseImage(&copy_image2);
    
    // Invert image
    cvNot(copy_image, copy_image);
    
    cvResize(copy_image, image, 0);
               
    // Find contours
    CvSeq* contours = 0;
    cvFindContours(
            copy_image,
            storage,
            &contours,
            sizeof(CvContour),
            CV_RETR_TREE, // CV_RETR_CCOMP CV_RETR_EXTERNAL
            CV_CHAIN_APPROX_NONE //SIMPLE
    );

    vector<marker> * result = new vector<marker>();
    get_box_lines(contours, width, height, scale_factor, *result, storage);
    
    cvReleaseImage(&copy_image);

    return result;

}

