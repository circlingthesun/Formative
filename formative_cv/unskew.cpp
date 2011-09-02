#include "unskew.h"

void rotate(IplImage * img, double deg){
    // Create temporary images
    IplImage* temp = cvCreateImage(
		cvGetSize(img),
		img->depth,
		img->nChannels
	);
	
	/* Rotate image */
    
    double scale = 1;
    
    // Rotation center
    CvPoint2D32f center = cvPoint2D32f(
        img->width/2,
        img->height/2
    );
    
    // Create rotation matrix
    CvMat* rot_mat = cvCreateMat(2,3,CV_32FC1);
    
    // Create 2d rotation matrix
    CvMat* rot = cv2DRotationMatrix(
        center,
        deg,
        scale,
        rot_mat
    );
    
    // Rotate 
    cvWarpAffine( img, temp, rot_mat, CV_INTER_LINEAR|CV_WARP_FILL_OUTLIERS, cvScalarAll(255));
    cvConvertImage(temp, img, 0);
    
    cvReleaseMat(&rot);
    //cvReleaseMat(&rot_mat);
    cvReleaseImage(&temp);
}

void unskew(IplImage * img){

    // Create temporary images
    IplImage* temp = cvCreateImage(
		cvGetSize(img),
		IPL_DEPTH_8U,
		1
	);
	
	IplImage* temp2 = cvCreateImage(
		cvGetSize(img),
		IPL_DEPTH_8U,
		1
	);
	
    cvConvertImage(img, temp, 0);

    cvSmooth(temp, temp2, CV_GAUSSIAN , 5 , 5, 0, 0);
    
    IplConvKernel* kernel = cvCreateStructuringElementEx( 5 /* cols */, 1, 3, 0,
                                             CV_SHAPE_RECT, NULL );
        
    cvReleaseStructuringElement(&kernel);
    
    // Open morph image
    cvMorphologyEx(temp2, temp2, temp, CV_SHAPE_RECT, CV_MOP_OPEN, 5); 
    
    // Edge detection
    cvCanny(temp2, temp, 200, 240, 3);
        
    // Find lines
    CvMemStorage* storage = cvCreateMemStorage(0);
    
    CvSeq* lines = cvHoughLines2(
        temp,
        storage,
        CV_HOUGH_PROBABILISTIC,
        5, // rho resolution
        CV_PI/45, // theta resoltion
        5, // Threshold pixels
        50, // Min returned
        5 // Seperation between coolinear points
    );
    
    int i;
    
    // Set up counts and initilialize counts to 0
    int cres = 10000; // Resolution at which angles are counted
    int* counts = (int*)malloc(sizeof(int)*(int)(CV_PI*cres)); // Counts angle counts
    for(i = 0; i < cres*CV_PI; i++){
        counts[i] = 0;
    }
    
    // Tollerated deviation angle of a horisontal line
    double delta = CV_PI/3.5; 
    
    
    // Find horisontal lines candidates
    for( i = 0; i < lines->total; i++ )
    {
        CvPoint* line = (CvPoint*)cvGetSeqElem(lines,i);
        
        // Slope of the line
        double slope = (atan((double)(line[1].y - line[0].y) / (double)(line[1].x - line[0].x)));
        
        int is_hor_candidate = slope < delta && slope > -delta;
        // Count for horisontal line candidates
        if(is_hor_candidate){
            int cpos = (int)((slope+CV_PI/2)*cres);
            counts[cpos]++;
        }

    }
        
    int max_pos = -1, max_val = 0;
    
    for(i = 0; i < cres*CV_PI; i++){
        if (counts[i] > max_val){
            max_pos = i;
            max_val = counts[i];
        }
    }
    
    free(counts);
    
    double rotate_angle = (((double)max_pos/(double)cres)-CV_PI/2)*57.2957795;
    rotate(img, rotate_angle);
    printf("Rotate: %f\n", rotate_angle);
    cvReleaseImage(&temp);
    cvReleaseImage(&temp2);
}

