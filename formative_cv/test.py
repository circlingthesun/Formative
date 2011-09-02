import formative_cv
import sys, Image

img = Image.open(sys.argv[1])
raw_img = img.convert('RGB').tostring()

raw_img2, w, h = formative_cv.parse(raw_img, img.size[0], img.size[1])
img2 = Image.fromstring("RGB", (w, h), raw_img2, "raw", "BGR", 0, 1)
img2.save("out.jpg")
