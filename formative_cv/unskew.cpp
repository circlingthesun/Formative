#include "unskew.h"

using namespace cv;

void unskew(Mat & img_rgb){

    // Create gray scale img
    Mat img_gray = Mat(Size(img_rgb.rows,img_rgb.cols), CV_8UC1);
    cvtColor(img_rgb,img_gray,CV_RGB2GRAY);

    // Reference image scale, this is the size at which
    // the algorithm has been found to work
    int ref_x = 1000;
    int ref_y = 1000;
    
    // Scale up/down to reference scale size
    double scale_factor;

    double x_ra = (double)img_gray.rows/ref_x;
    double y_ra = (double)img_gray.cols/ref_y;

    if(x_ra > y_ra)
        scale_factor = x_ra;
    else
        scale_factor = y_ra;

    int cols = img_gray.cols/scale_factor+0.5;
    int rows = img_gray.rows/scale_factor+0.5;
    
    // Create new resized image
    Mat resized_img = Mat(Size(cols,rows), CV_8UC1);
    resize(img_gray, resized_img, Size(cols,rows));


    // Clean up with blur
    GaussianBlur(resized_img, resized_img, Size(5, 5), 0,0);
        
    // Edge detection
    Canny(resized_img, resized_img, 100, 240, 3);
        
    // Find lines...
    
    vector<Vec4i> lines;
    double rho = 5; // rho resolution
    double theta = CV_PI/45; // theta resoltion
    int thresh = 30; // Threshold pixel votes
    int min_len = 30; // Min line length
    int max_line_gap = 10; // Seperation between coolinear points

    // Needs heuristics
    HoughLinesP( resized_img, lines, rho, theta, thresh, min_len, max_line_gap );
       
    int cres = 10000; // Resolution at which angles are counted
    int arr_size = (int)(cres*CV_PI);

    int * counts = new int[arr_size];

    for(int i=0; i < arr_size; i++){
        counts[i] = 0;
    }
    
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
    
    for(int i = 0; i < arr_size; i++){
        if (counts[i] > max_val){
            max_pos = i;
            max_val = counts[i];
        }
    }
    
    delete [] counts;

    double rotate_angle = (((double)max_pos/(double)cres)-CV_PI/2)*57.2957795;\

    // Find center 
    Point2f center(img_rgb.rows/2.0f, img_rgb.cols/2.0f);
    // Create rotation matrix
    Mat rot_mat = getRotationMatrix2D(center, rotate_angle, 1);
    // Rotate
    warpAffine( img_rgb.clone(), img_rgb, rot_mat, Size(img_rgb.cols, img_rgb.rows),
            INTER_LINEAR, BORDER_CONSTANT, Scalar(255, 255, 255)); 

    printf("Rotated: %f\n", rotate_angle);
}

