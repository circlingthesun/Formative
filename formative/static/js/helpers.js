function calc_scale(max_x, max_y, img){
    var width = img.width;
    var height = img.height;

    var scale_f = 1;
    
    if (width > height || max_y === 0) {
        if (width > max_x) {
            scale_f = max_x / width
        }
    } else {
        if (height > max_y || max_x === 0) {
            scale_f = max_y / height;
        }
    }

    return scale_f;
}

// http://www.overset.com/2007/07/11/javascript-recursive-object-copy-deep-object-copy-pass-by-value/
function deepObjCopy (dupeObj) {
    var retObj = new Object();
    if (dupeObj instanceof Object) {
        if (typeof(dupeObj.length) != 'undefined')
            var retObj = new Array();
        for (var objInd in dupeObj) {   
            if (dupeObj[objInd] instanceof Object) {
                retObj[objInd] = deepObjCopy(dupeObj[objInd]);
            } else if (dupeObj[objInd] instanceof String) {
                retObj[objInd] = dupeObj[objInd];
            } else if (dupeObj[objInd] instanceof Number) {
                retObj[objInd] = dupeObj[objInd];
            } else if (dupeObj[objInd] instanceof Boolean) {
                ((dupeObj[objInd] == true) ? retObj[objInd] = true : retObj[objInd] = false);
            }
        }
    }
}