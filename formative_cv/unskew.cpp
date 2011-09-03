#include "unskew.h"

using namespace cv;

void unskew(Mat & img_rgb){


    Mat img_gray = Mat(Size(img_rgb.rows,img_rgb.cols), CV_8UC1);
    // Create gray scale
    cvtColor(img_rgb,img_gray,CV_RGB2GRAY);
    GaussianBlur(img_gray, img_gray, Size(5, 5), 0,0);
        
    // Edge detection
    Canny(img_rgb, img_rgb, 200, 240, 3);
        
    // Find lines...
    
    vector<Vec4i> lines;
    double rho = 5; // rho resolution
    double theta = CV_PI/45; // theta resoltion
    int thresh = 5; // Threshold pixel votes
    int min_len = 50; // Min line length
    int max_line_gap = 5; // Seperation between coolinear points

    HoughLinesP( img_gray, lines, rho, theta, thresh, min_len, max_line_gap ); // Needs heuristics
    
       
    int cres = 10000; // Resolution at which angles are counted
    vector<int> counts(cres*CV_PI, 0);
    
    // Tollerated deviation angle of a horisontal line
    double delta = CV_PI/3.5; 
    
    // Find horisontal lines candidates
    for( size_t i = 0; i < lines.size(); i++ )
    {        
        // Slope of the line
        double slope = (atan((double)(lines[i][1] - lines[i][3]) /
            (double)(lines[i][0] - lines[i][2])));
        
        int is_hor_candidate = slope < delta && slope > -delta;
        // Count for horisontal line candidates
        if(is_hor_candidate){
            int cpos = (int)((slope+CV_PI/2)*cres);
            counts[cpos]++;
        }

    }
        
    int max_pos = -1, max_val = 0;
    
    for(int i = 0; i < cres*CV_PI; i++){
        if (counts[i] > max_val){
            max_pos = i;
            max_val = counts[i];
        }
    }
    
    
    double rotate_angle = (((double)max_pos/(double)cres)-CV_PI/2)*57.2957795;\

    // Find center 
    Point2f center(img_rgb.rows/2.0f, img_rgb.cols/2.0f);
    // Create rotation matrix
    Mat rot_mat = getRotationMatrix2D(center, rotate_angle, 1);
    // Rotate
    warpAffine( img_rgb, img_rgb, rot_mat, Size(),
            INTER_LINEAR, BORDER_CONSTANT, Scalar(255)); 

    printf("Rotated: %f\n", rotate_angle);
}

