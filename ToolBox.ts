const fs = require('fs');
const util = require('util');
const paper = require('paper-jsdom');
export { }

const MAX_POINT = new paper.Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);


///*
// * 
// * array helpers
// * 
// */
export function MIB(i, max)
{
    while (i >= max) { i -= max; }
    while (i < 0) { i += max; }
    return i;
}



///*
// * 
// * Little helpers
// * 
// */
export function PointLerp(point1, point2, percentage)
{
    return point1.add((point2.subtract(point1)).multiply(percentage))
}



///*
// * 
// * curve stuff
// * 
// */


export function GetKissingDataForCurvePair(curve1, curve2, radius, clockwise, center = null, closeepsilon = 1e-9)
{
    var kissdata = { Center: center, OriginalPoint: PointLerp(curve1.point2, curve2.point1, 0.5), Radius: radius, Time1: 0, Time2: 0, Point1: null, Point2: null, Normal1: null, Normal2: null, Type: 0, Tangent: null };

    if (kissdata.Center == null)
    {
        var norm1 = curve1.getNormalAtTime(1).normalize(radius);
        var norm2 = curve2.getNormalAtTime(0).normalize(radius);
        var combinednorm = norm1.add(norm2);

        if (combinednorm.isZero())
        {
            kissdata.Center = (norm1.rotate(90)).add(kissdata.OriginalPoint);
        }
        else
        {
            kissdata.Center = ((norm1.add(norm2)).normalize(Math.abs(radius))).add(kissdata.OriginalPoint);
        }
    }

    var oldcenter = MAX_POINT;
    var olddistance = Number.MAX_SAFE_INTEGER;
    var oldvector = MAX_POINT;
    var count = 0;
    while (1)
    {
        // bit of a hack just to make sure we exit loop
        if (count > 50 && count % 10 == 0)
        {
            closeepsilon *= 10;
        }
        count++;


        kissdata.Point1 = curve1.getNearestPoint(kissdata.Center);
        kissdata.Point2 = curve2.getNearestPoint(kissdata.Center);

        // checking they are actully closest points and not the beggining/end , also set times
        if (curve1.point2.getDistance(kissdata.Center) <= kissdata.Point1.getDistance(kissdata.Center) + closeepsilon)
        {
            kissdata.Point1 = curve1.point2;
            kissdata.Time1 = 1;
        }
        else if (curve1.point1.getDistance(kissdata.Center) <= kissdata.Point1.getDistance(kissdata.Center) + closeepsilon)
        {
            kissdata.Point1 = curve1.point1;
            kissdata.Time1 = 0;
        }
        else
        {
            kissdata.Time1 = curve1.getTimeOf(kissdata.Point1);
        }
        if (curve2.point1.getDistance(kissdata.Center) <= kissdata.Point2.getDistance(kissdata.Center) + closeepsilon)
        {
            kissdata.Point2 = curve2.point1;
            kissdata.Time2 = 0;
        }
        else if (curve2.point2.getDistance(kissdata.Center) <= kissdata.Point2.getDistance(kissdata.Center) + closeepsilon)
        {
            kissdata.Point2 = curve2.point2;
            kissdata.Time2 = 1;
        }
        else
        {
            kissdata.Time2 = curve2.getTimeOf(kissdata.Point2);
        }

        kissdata.Normal1 = curve1.getNormalAtTime(kissdata.Time1).normalize(radius);
        kissdata.Normal2 = curve2.getNormalAtTime(kissdata.Time2).normalize(radius);
        kissdata.Tangent = curve1.getTangentAtTime(kissdata.Time1).normalize(Math.abs(radius));

        var newvector = kissdata.Center.subtract(oldcenter);
        var newdistance = oldcenter.getDistance(kissdata.Center);

        if (newvector.add(oldvector).length < closeepsilon)
        {
            return kissdata;
        }
        oldcenter = kissdata.Center;
        olddistance = newdistance;
        oldvector = newvector;


        var circledata = GetCircleCenter(kissdata.Point1, kissdata.Point2, radius, closeepsilon);

        if (circledata.Error == 0) // points ok
        {
            kissdata.Center = circledata.Center1;
            kissdata.Type = -1;
        }
        else if (circledata.Error == 1) // points too close 
        {
            var anglediff = kissdata.Normal1.getAngle(kissdata.Normal2);

            if (anglediff < 0.001) // not expanding or shrinking
            {
                kissdata.Center = ((kissdata.Normal1.add(kissdata.Normal2)).normalize(Math.abs(radius))).add(kissdata.OriginalPoint);
                kissdata.Type = 0;
            }
            else if (anglediff >= 180) // parallel
            {
                var line = new paper.Line(curve1.point1, curve2.point2);
                var side = line.getSide(kissdata.Point1); // minus 1 for right

                if (side == 1)
                {
                    kissdata.Center = kissdata.OriginalPoint.add(curve1.getTangentAtTime(1).normalize(radius));
                    kissdata.Type = Math.sign(radius);
                }
                else if (side == -1)
                {
                    kissdata.Center = kissdata.OriginalPoint.add(curve1.getTangentAtTime(1).normalize(radius * -1));
                    kissdata.Type = Math.sign(radius * -1);
                }
                else // if it hits here we assume identical lines to we make a cap
                {
                        kissdata.Center = kissdata.OriginalPoint.add(curve1.getTangentAtTime(1).normalize(Math.abs(radius)));
                        kissdata.Type = 1;
                }
            }
            else  
            {
                kissdata.Center = ((kissdata.Normal1.add(kissdata.Normal2)).normalize(Math.abs(radius))).add(kissdata.OriginalPoint);
                kissdata.Type = 1;
            }
        }

        else if (circledata.Error == 2) // points too far
        {
            kissdata.Type = -2;
        }
    }

    return kissdata;
}

export function SplitCurveAtTimes(originalcurve, timelist)
{
    if (!util.isArray(timelist)) { timelist = [timelist]; }
    timelist.sort(function (a, b) { return a - b; })
    var curvelist = [];

    if (originalcurve.isStraight())
    {
        var zeropoint = new paper.Point(0, 0);
        if (timelist[0] != 0)
        {
            timelist.splice(0, 0, 0);
        }
        if (timelist[timelist.length - 1] != 1)
        {
            timelist.push(1);
        }
        for (var i = 0; i < timelist.length - 1; i++)
        {
            var p1 = originalcurve.getPointAtTime(timelist[i]);
            var p2 = originalcurve.getPointAtTime(timelist[i + 1]);
            curvelist.push(new paper.Curve(p1, zeropoint, zeropoint, p2));
        }
    }
    else
    {
        curvelist = [originalcurve.clone()];
        var index = 0;
        for (var i = 0, prevT, l = timelist && timelist.length; i < l; i++)
        {
            var t = timelist[i];
            var curve = curvelist[index].divideAtTime(i ? (t - prevT) / (1 - prevT) : t);
            prevT = t;
            if (curve)
            {
                curvelist.splice(++index, 0, curve);
            }
        }
    }
    return curvelist;
}

export function SplitCurveForTolerance(curve, curvetolerance, lengthtolerance)
{
    if (!curve.bounds.center.isClose(curve.getPointAtTime(0.5), curvetolerance) || curve.length > lengthtolerance)
    {
        var halves = SplitCurveAtTimes(curve, [0.5]);
        return SplitCurveForTolerance(halves[0], curvetolerance, lengthtolerance).concat(SplitCurveForTolerance(halves[1], curvetolerance, lengthtolerance));
    }
    return [curve.clone()];
}

/**
 * Taken from lehni's code
 * Returns the first curve-time where the curve has its tangent in the same
 * direction as the average of the tangents at its beginning and end.
 */
export function getAverageTangentTimeOfCurve(v)
{
    var tan = paper.Curve.getTangent(v, 0).add(
        paper.Curve.getTangent(v, 0.5)).add(
            paper.Curve.getTangent(v, 1)),
        tx = tan.x,
        ty = tan.y,
        flip = Math.abs(ty) < Math.abs(tx),
        s = flip ? ty / tx : tx / ty,
        ia = flip ? 1 : 0, // the abscissa index
        io = ia ^ 1,       // the ordinate index
        a0 = v[ia + 0], o0 = v[io + 0],
        a1 = v[ia + 2], o1 = v[io + 2],
        a2 = v[ia + 4], o2 = v[io + 4],
        a3 = v[ia + 6], o3 = v[io + 6],
        aA = -a0 + 3 * a1 - 3 * a2 + a3,
        aB = 3 * a0 - 6 * a1 + 3 * a2,
        aC = -3 * a0 + 3 * a1,
        oA = -o0 + 3 * o1 - 3 * o2 + o3,
        oB = 3 * o0 - 6 * o1 + 3 * o2,
        oC = -3 * o0 + 3 * o1,
        roots = [],
        epsilon = paper.Numerical.CURVETIME_EPSILON,
        count = paper.Numerical.solveQuadratic(
            3 * (aA - s * oA),
            2 * (aB - s * oB),
            aC - s * oC, roots,
            epsilon, 1 - epsilon);
    // Fall back to 0.5, so we always have a place to split...
    return count > 0 ? roots[0] : 0.5;
}
///*
// * 
// * path stuff
// * 
// */
export function MakePathFromCurves(curves, closedpath)
{
    if (!util.isArray(curves)) { curves = [curves]; }
    if (curves.length == 0) { return null; }
    var segs = [];
    segs.push(curves[0].segment1);
    for (var i = 0; i < curves.length - 1; i++)
    {
        segs.push(new paper.Segment(PointLerp(curves[i].point2, curves[i + 1].point1, 0.5), curves[i].segment2.handleIn, curves[i + 1].segment1.handleOut));
    }
    segs.push(curves[curves.length - 1].segment2);

    var rpath = new paper.Path(segs);
    if (closedpath) { rpath.closePath(); }
    return rpath;
}


export function SplitCompoundIntoArray(path)
{
    var patharray = [];
    if (path instanceof paper.CompoundPath)
    {
        for (var i = 0; i < path.children.length; i++)
        {
            patharray = patharray.concat(SplitCompoundIntoArray(path.children[i]));
        }
        return patharray;
    }
    else
    {
        var tp = new paper.Path(path.segments);
        if (path.closed) { tp.closePath(); }
        return [tp];
    }
}

///*
// * 
// * Geom
// * 
// */

export function GetCircleCenter(point1, point2, radius, epsilon = 1e-9)
{
    var absradius = Math.abs(radius);
    var distancebetweenpoints = point1.getDistance(point2);
    if (distancebetweenpoints <= epsilon) { return { Error: 1 }; }               // need two unique points so return error
    if (distancebetweenpoints > absradius * 2) { return { Error: 2 }; }         // points too far away so circle isn't big enough 

    var midpoint = PointLerp(point1, point2, 0.5);
    var middistance = point1.getDistance(midpoint);
    var centerdistance = Math.sqrt(Math.abs((absradius * absradius) - (middistance * middistance)));
    var linetocenter = (midpoint.subtract(point1)).normalize(centerdistance);

    var center1 = (midpoint.add(linetocenter.rotate(-90)));
    var center2 = (midpoint.add(linetocenter.rotate(90)));

    if (radius > 0)
    {
        return { Center1: center1, Center2: center2, Error: 0 };
    }
    else
    {
        return { Center1: center2, Center2: center1, Error: 0 };
    }
}

export function FindCircleCircleintersection(center1, radius1, center2, radius2)
{
    var r0 = Math.abs(radius1);
    var r1 = Math.abs(radius2);
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = center2.x - center1.x;
    dy = center2.y - center1.y;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy * dy) + (dx * dx));

    /* Check for solvability. */
    if (d > (r0 + r1))
    {
        /* no solution. circles do not intersect. */
        return null;
    }
    if (d < Math.abs(r0 - r1))
    {
        /* no solution. one circle is contained in the other */
        return null;
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.  
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

    /* Determine the coordinates of point 2. */
    x2 = center1.x + (dx * a / d);
    y2 = center1.y + (dy * a / d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0 * r0) - (a * a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h / d);
    ry = dx * (h / d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    //debugger;

    if (radius1 >= 0 && radius2 >= 0) { return new paper.Point(xi_prime, yi_prime); }
    if (radius1 <= 0 && radius2 <= 0) { return new paper.Point(xi, yi); }
    // [xi, xi_prime, yi, yi_prime];
}

export function getarcmiddle(startpoint, center, endpoint, tangent)
{
    var v1 = startpoint.subtract(center);
    var v2 = endpoint.subtract(center);
    var newlength = v1.length + ((v2.length - v1.length) / 2);
    var angle = v1.getDirectedAngle(v2);
    if (Math.abs(Math.abs(angle) - 180) < 1)
    {
        return center.add(tangent.normalize(newlength));
    }
    return center.add((v1.normalize(newlength)).rotate(angle / 2));
}

///*
// * 
// * file
// * 
// */


export function SavePaths(paths, filename, object = { Multicolor: false, FirstPathBlack: false, StrokeWidth: 0.1, PercentageBorders: 5, SetBorder: 0 })
{
    if (object.Multicolor == null) { object.Multicolor = false; }
    if (object.FirstPathBlack == null) { object.FirstPathBlack = false; }
    if (object.StrokeWidth == null) { object.StrokeWidth = 0.1; }
    if (object.PercentageBorders == null) { object.PercentageBorders = 5; }
    if (object.SetBorder == null) { object.SetBorder = 0; }

    filename = filename + ".SVG";
    if (!util.isArray(paths)) { paths = [paths]; }

    var color = new paper.Color(1, 0, 0);
    var colorshift = 350 / paths.length;
    var output = '';

    var TopLeftPoint = new paper.Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    var BottemRightPoint = new paper.Point(0, 0);
    var SizePoint;
    for (var i = 0; i < paths.length; i++)
    {
        if (paths[i] != null)
        {
            if (paths[i].strokeColor == null)
            {
                paths[i].strokeColor = '#000000';
                paths[i].strokeWidth = object.StrokeWidth;
            }
            if (object.Multicolor)
            {
                paths[i].strokeColor = color.clone();
                color.hue += colorshift;
            }
            if (object.FirstPathBlack && i == 0)
            {
                paths[i].strokeColor = '#000000';
            }

            TopLeftPoint = paper.Point.min(TopLeftPoint, paths[i].bounds.topLeft);
            BottemRightPoint = paper.Point.max(BottemRightPoint, paths[i].bounds.bottomRight);
            output += paths[i].exportSVG({ asString: true }) + "\r\n";
        }
    }

    SizePoint = (BottemRightPoint.subtract(TopLeftPoint));
    if (SizePoint.x == 0) { SizePoint.x = 1; }
    if (SizePoint.y == 0) { SizePoint.y = 1; }
    if (object.PercentageBorders != 0 && object.SetBorder == 0)
    {
        var perc = SizePoint.multiply(object.PercentageBorders / 100);
        BottemRightPoint = BottemRightPoint.add(perc);
        TopLeftPoint = TopLeftPoint.subtract(perc);
    }
    else if (object.SetBorder != 0)
    {
        var perc = new paper.Point(object.SetBorder, object.SetBorder);
        BottemRightPoint = BottemRightPoint.add(perc);
        TopLeftPoint = TopLeftPoint.subtract(perc);
    }
    SizePoint = (BottemRightPoint.subtract(TopLeftPoint));
    if (SizePoint.x == 0) { SizePoint.x = 1; }
    if (SizePoint.y == 0) { SizePoint.y = 1; }

    var viewportstring = "0 0 " + SizePoint.x + " " + SizePoint.y + " ";
    var viewboxstring = " " + TopLeftPoint.x + " " + TopLeftPoint.y + " " + SizePoint.x + " " + SizePoint.y + " ";
    output = '<svg version="1.1" baseProfile="full" viewBox="' + viewboxstring + '" viewPort="' + viewportstring + '" xmlns="http://www.w3.org/2000/svg"> \r\n' + output + "</svg>";
    fs.writeFileSync(filename, output);
}


















/*8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888*/




/*
 *
 * Deffos
 *
 */

//const ZERO_POINT = new paper.Point(0, 0);
//const MAX_POINT = new paper.Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);


///*
// * 
// * Little helpers
// * 
// */
//export function PointLerp(point1, point2, percentage)
//{
//    return point1.add((point2.subtract(point1)).multiply(percentage))
//}



///*
// * 
// * Array/List helpers
// * 
// */
//export function GetDistanceBetweenIndexs(index1, index2, listlength)
//{
//    if (index1 < index2) { return index2 - index1; }
//    return index2 + (listlength - index1);
//}



/*
 *  File stuff
 *
 *
 */


/*
 *
 *
 * Circle fitting
 *
 */

//export function FitCircle(curves, circlecenter, circleradius,canshrink,epsilon = 1e-6)
//{
//    if (curves.length < 2) { console.log("Error: Fit circle funtion needs at least two curves");}
//    var abscircleradius = Math.abs(circleradius);
//    var rdata = { Center: circlecenter,Type:0 };
//    var oldcenter = MAX_POINT;
//    var olddistance = Number.MAX_SAFE_INTEGER;
//    var circledata = { Center: circlecenter };


//    var count = 100;
//    while (1)
//    {
//        var distance = circledata.Center.getDistance(oldcenter);
//        console.log("distance " + distance);

//        //if (distance == olddistance)
//        //{
//        //    if(!canshrink)
//        //    return circledata;
//        //}
//        //olddistance = distance;

//        if (circledata.Center.isClose(oldcenter, epsilon)||count ==0)
//        {
//            if (count == 0) { console.log("counted out");}
//            return circledata;
//        }
//        oldcenter = circledata.Center;
//        count--;

//        var curvesdata = GetCurvesData();

//        if (!curvesdata[1].InRange)
//        {
//            circledata.Center = curvesdata[0].OffPoint;
//        }
//        else // so should have two valid points then
//        {

//            var circlefitdata = GetCircleCenter(curvesdata[0].Point, curvesdata[1].Point, circleradius,epsilon);
//            console.log("error : " + circlefitdata.Error);
//            console.log("ids " + curvesdata[0].CurveIndex + "," + curvesdata[1].CurveIndex);


//            if (circlefitdata.Error == 0)
//            {
//                if (circlefitdata.Center1.getDistance(circledata.Center) < circlefitdata.Center2.getDistance(circledata.Center))
//                {
//                    circledata.Center = circlefitdata.Center1;
//                }
//                else
//                {
//                    circledata.Center = circlefitdata.Center2;
//                }
//            }
//            else if (circlefitdata.Error == 1) // points too close
//            {
//                if (curvesdata[0].Normal.equals(curvesdata[1].Normal))// not expanding or shrinking
//                {
//                    circledata.Center = curvesdata[0].OffPoint;
//                }
//                else
//                {
//                    var combinednormal = curvesdata[0].Normal.add(curvesdata[1].Normal);
//                    if (combinednormal.isZero()) // is 180 degree so cap end
//                    {
//                        if (GetDistanceBetweenIndexs(curvesdata[0].CurveId, curvesdata[1].CurveId, curvesdata.length) < GetDistanceBetweenIndexs(curvesdata[1].CurveId, curvesdata[0].CurveId, curvesdata.length))
//                        {
//                            circledata.Center = (curvesdata[0].Normal.rotate(-90)).add(curvesdata[0].Point);
//                        }
//                        else
//                        {
//                            circledata.Center = (curvesdata[0].Normal.rotate(90)).add(curvesdata[0].Point);
//                        }
//                    }
//                    else // must be an expander then
//                    {

//                        circledata.Center = (combinednormal.normalize(abscircleradius)).add(curvesdata[0].Point);
//                    }
//                }
//            }
//            else if (circlefitdata.Error == 0) 
//            {
//                console.log("ERROR: FIT CIRCLE SHOWING ERROR 0");
//                circledata.Center = curvesdata[0].OffPoint;
//            }

//        }

//    }





//    function GetCurvesData()
//    {
//        var curvedatalist = [];
//        for (var i = 0; i < curves.length; i++)
//        {
//            var point = curves[i].getNearestPoint(circledata.Center);
//            var distance = circledata.Center.getDistance(point);
//            var inrange = distance < abscircleradius + epsilon;
//            var time = curves[i].getTimeOf(point);
//            var normal = curves[i].getNormalAtTime(time).normalize(circleradius);
//            var offpoint = normal.add(point);
//            curvedatalist.push({ Point: point, Distance: distance, InRange: inrange, OffPoint:offpoint,Normal:normal,Time:time,CurveIndex:i});
//        }
//        curvedatalist.sort(function (a, b){return a.Distance - b.Distance;});
//        return curvedatalist;
//    }
//}

//export function FitCircle(curves, circlecenter, circleradius, canshrink, epsilon = 1e-6)
//{
//    var circledata = { Center: circlecenter };
//    var abscircleradius = Math.abs(circleradius);
//    var oldcenter = MAX_POINT;


//    while (1)
//    {
//        if (oldcenter.isClose(circledata.Center, epsilon))
//        {
//            return circledata;
//        }
//        oldcenter = circledata.Center;
//        var curvedata = GetCurvesData();
//        circledata.Center = curvedata[0].OffPoint;
//    }





//    function GetCurvesData()
//    {
//        var curvedatalist = [];
//        for (var i = 0; i < curves.length; i++)
//        {
//            var point = curves[i].getNearestPoint(circledata.Center);
//            var distance = circledata.Center.getDistance(point);
//            var inrange = distance < abscircleradius + epsilon;
//            var time = curves[i].getTimeOf(point);
//            var normal = curves[i].getNormalAtTime(time).normalize(circleradius);
//            var offpoint = normal.add(point);
//            curvedatalist.push({ Point: point, Distance: distance, InRange: inrange, OffPoint:offpoint,Normal:normal,Time:time,CurveIndex:i});
//        }
//        curvedatalist.sort(function (a, b){return a.Distance - b.Distance;});
//        return curvedatalist;
//    }

//}


///*
// * 
// * Geom stuff
// * 
// */

//export function GetCircleCenter(point1, point2, radius, epsilon = 1e-6)
//{
//    var absradius = Math.abs(radius);
//    var distancebetweenpoints = point1.getDistance(point2);
//    if (distancebetweenpoints < epsilon) { return { Error: 1 }; }               // need two unique points so return error
//    if (distancebetweenpoints > absradius * 2) { return { Error: 2 }; }         // points too far away so circle isn't big enough 

//    var midpoint = PointLerp(point1, point2, 0.5);
//    var middistance = point1.getDistance(midpoint);
//    var centerdistance = Math.sqrt(Math.abs((absradius * absradius) - (middistance * middistance)));
//    if (centerdistance < epsilon) { return { Center1: midpoint,Center2:midpoint, PossibleCenters: 1, Error: 0 }; } // both points only just touch the circle
//    var linetocenter = (midpoint.subtract(point1)).normalize(centerdistance);

//    if (radius > 0)
//    {
//        return { Center1: (midpoint.add(linetocenter.rotate(-90))), Center2: (midpoint.add(linetocenter.rotate(90))), PossibleCenters: 2, Error: 0 };
//    }
//    else
//    {
//        return { Center1: (midpoint.add(linetocenter.rotate(90))), Center2: (midpoint.add(linetocenter.rotate(-90))), PossibleCenters: 2, Error: 0 };
//    }
//}


//const OFFSET_EPSILON = 1e-6;

//export function MIB(i, max)
//{
//    while (i >= max) { i -= max; }
//    while (i < 0) { i += max; }
//    return i;
//}

//export function PointLerp(point1, point2, percentage)
//{
//    return point1.add((point2.subtract(point1)).multiply(percentage))
//}

//export function BreakPathAtPeaks(path)
//{
//    var path = path.clone();
//    for (var i = 0; i < path.curves.length; i++)
//    {
//        if (!path.curves[i].isStraight())
//        {
//            var times = paper.Curve.getPeaks(path.curves[i].getValues()).concat(path.curves[i].classify().roots);
//            times = times.filter(Number);
//            times.sort(function (a, b) { return a - b; });
//            if (times.length > 0)
//            {
//                path.divideAt(path.curves[i].getLocationAtTime(times[0]));
//            }
//        }
//    }
//    return path;
//}


//function SwapForShortestRoute(id1, id2, listlength)
//{
//    var min = Math.min(id1, id2);
//    var max = Math.max(id1, id2);

//    var d1 = max - min;
//    var d2 = (listlength - max) + min;

//    if (d1 <= d2)
//    {
//        return id1 != min;
//    }
//    else
//    {
//        return id1 != max;
//    }
//}

//export function NumberLerp(number1, number2, percentage)
//{
//    return number1 + ((number2 - number1) * percentage);
//}

//export function GetCurveDataForCircle(curves, center, radius)
//{
//    var data = [];
//    var absradius = Math.abs(radius);

//    for (var i = 0; i < curves.length; i++)
//    {
//        var point = curves[i].getNearestPoint(center);
//        var distance = point.getDistance(center);
//        var inrange = distance <= absradius * 1.01; // .1% tolerance 
//        var time = curves[i].getTimeOf(point);
//        var normal = curves[i].getNormalAtTime(time).normalize(radius);
//        var offpoint = normal.add(point);
//        data.push({ Point: point, Distance: distance, InRange: inrange, Time: time, Normal: normal, OffPoint: offpoint, CurveId: i });
//    }
//    data.sort(function (a, b)
//    {
//        return a.Distance - b.Distance;
//    });

//    if (data.length >= 2)
//    {
//        if (data[0].InRange && data[1].InRange)
//        {
//            if (SwapForShortestRoute(data[0].CurveId, data[1].CurveId, curves.length))
//            {
//                var t = data[0];
//                data[0] = data[1];
//                data[1] = t;
//            }
//        }
//    }



//    return data;
//}

//export function SplitCurveAtTimes(originalcurve, timelist)
//{
//    if (!util.isArray(timelist)) { timelist = [timelist]; }
//    timelist.sort(function (a, b) { return a - b; })
//    var curvelist = [];

//    if (originalcurve.isStraight())
//    {
//        var zeropoint = new paper.Point(0, 0);
//        if (timelist[0] != 0)
//        {
//            timelist.splice(0, 0, 0);
//        }
//        if (timelist[timelist.length - 1] != 1)
//        {
//            timelist.push(1);
//        }
//        for (var i = 0; i < timelist.length - 1; i++)
//        {
//            var p1 = originalcurve.getPointAtTime(timelist[i]);
//            var p2 = originalcurve.getPointAtTime(timelist[i + 1]);
//            curvelist.push(new paper.Curve(p1, zeropoint, zeropoint, p2));
//        }
//    }
//    else
//    {
//        curvelist = [originalcurve.clone()];
//        var index = 0;
//        for (var i = 0, prevT, l = timelist && timelist.length; i < l; i++)
//        {
//            var t = timelist[i];
//            var curve = curvelist[index].divideAtTime(i ? (t - prevT) / (1 - prevT) : t);
//            prevT = t;
//            if (curve)
//            {
//                curvelist.splice(++index, 0, curve);
//            }
//        }
//    }
//    return curvelist;
//}

//export function RecursiveDivideCurve(curve, tolerance)
//{
//    if (curve.bounds.center.isClose(curve.getPointAtTime(0.5), tolerance)) { return [curve.clone()]; }
//    var halves = SplitCurveAtTimes(curve, [0.5]);
//    return RecursiveDivideCurve(halves[0], tolerance).concat(RecursiveDivideCurve(halves[1], tolerance));
//}

//export function GetArcThroughPointFor(radius, center, startpos, endpos)
//{
//    var middle = PointLerp(startpos, endpos, 0.5);
//    middle = middle.subtract(center);
//    console.log("middle length " + middle.length);

//    if (middle.length > OFFSET_EPSILON)
//    { 
//        middle = middle.normalize(Math.abs(radius));
//    }
//    else
//    {
//        middle = (endpos.subtract(center)).rotate(-90);
//    }
//    middle = middle.add(center)
//    return middle;
//}

//export function FindCircleCircleintersection(center1, radius1, center2, radius2)
//{
//    var r0 = Math.abs(radius1);
//    var r1 = Math.abs(radius2);
//    var a, dx, dy, d, h, rx, ry;
//    var x2, y2;

//    /* dx and dy are the vertical and horizontal distances between
//     * the circle centers.
//     */
//    dx = center2.x - center1.x;
//    dy = center2.y - center1.y;

//    /* Determine the straight-line distance between the centers. */
//    d = Math.sqrt((dy * dy) + (dx * dx));

//    /* Check for solvability. */
//    if (d > (r0 + r1))
//    {
//        /* no solution. circles do not intersect. */
//        return null;
//    }
//    if (d < Math.abs(r0 - r1))
//    {
//        /* no solution. one circle is contained in the other */
//        return null;
//    }

//    /* 'point 2' is the point where the line through the circle
//     * intersection points crosses the line between the circle
//     * centers.  
//     */

//    /* Determine the distance from point 0 to point 2. */
//    a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

//    /* Determine the coordinates of point 2. */
//    x2 = center1.x + (dx * a / d);
//    y2 = center1.y + (dy * a / d);

//    /* Determine the distance from point 2 to either of the
//     * intersection points.
//     */
//    h = Math.sqrt((r0 * r0) - (a * a));

//    /* Now determine the offsets of the intersection points from
//     * point 2.
//     */
//    rx = -dy * (h / d);
//    ry = dx * (h / d);

//    /* Determine the absolute intersection points. */
//    var xi = x2 + rx;
//    var xi_prime = x2 - rx;
//    var yi = y2 + ry;
//    var yi_prime = y2 - ry;

//    //debugger;

//    if (radius1 >= 0 && radius2 >= 0) { return new paper.Point(xi_prime, yi_prime); }
//    if (radius1 <= 0 && radius2 <= 0) { return new paper.Point(xi, yi); }
//    // [xi, xi_prime, yi, yi_prime];
//}

//export function FitCircleOntoCurves(curves,center,radius)
//{
//    var absradius = Math.abs(radius);
//    var curvedata = [];
//    var data = { Center: center, PointsOfContact: 0, Type: 0, Radius: radius, CurveData1: null, CurveData2: null };
//    var oldcenter = new paper.Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

//    for (var i = 0; i < 10;i++)
//    {
//      //  console.log("i " + i);
//        curvedata = GetCurveDataForCircle(curves, data.Center, radius);
//        if (oldcenter.isClose(data.Center, OFFSET_EPSILON))
//        {
//            if (curvedata.length >= 3)
//            {
//                if (curvedata[2].Distance < absradius)
//                {
//                        var tvar = GetCircleFrom3Points(curvedata[0].Point, curvedata[1].Point, curvedata[2].Point);
//                        if (tvar != null)
//                        {
//                            var newradius = tvar[1];
//                            if (radius < 0) { newradius *= -1; }

//                            var diff = Math.abs(newradius - radius);
//                            console.log(diff + " new radius " + newradius);

//                            if (diff > OFFSET_EPSILON)
//                            {
//                                return FitCircleOntoCurves(curves, center, newradius);
//                            }
//                        }
//                }
//            }
//            return data;
//        }
//        oldcenter = data.Center;

//    //    debugger;

//        if (curvedata.length == 1)
//        {
//            data.Center = curvedata[0].OffPoint;
//            data.PointsOfContact = 1;
//            data.Type = 0;
//            data.CurveData1 = curvedata[0];
//            data.CurveData2 = null;
//         //   console.log("data length 1");
//        }
//        else if (!curvedata[1].InRange)
//        {
//            data.Center = curvedata[0].OffPoint;
//            data.PointsOfContact = 1;
//            data.Type = 0;
//            data.CurveData1 = curvedata[0];
//            data.CurveData2 = null;
//         //   console.log("none in range");
//        }
//        else // first two must be in range then
//        {
//            var circledata = GetCircleCenter(curvedata[0].Point, curvedata[1].Point, radius);
//        //    debugger;
//            if (circledata.Error == 0) // got a good fitting circle
//            {
//                data.Center = circledata.Center;
//                data.PointsOfContact = 2;
//                data.Type = -1; // shrinker
//                data.CurveData1 = curvedata[0];
//                data.CurveData2 = curvedata[1];
//            //    console.log("fitted circle");
//            }
//            else if (circledata.Error == 1) // points too close
//            {
//                var angle = curvedata[0].Normal.getAngle(curvedata[1].Normal);
//                angle = Math.round((angle + Number.EPSILON) * 100) / 100
//                if (angle >= 180)
//                {
//                    data.Center = curvedata[0].Point.add(curvedata[0].Normal.rotate(90));
//                }
//                else
//                {
//                    data.Center = curvedata[0].Point.add((curvedata[0].Normal.add(curvedata[1].Normal)).normalize(absradius));
//                }
//                data.PointsOfContact = 2;
//                if (Math.abs(angle) > 0.1) { data.Type = 1; }
//                else { data.Type = 0; }
//                data.CurveData1 = curvedata[0];
//                data.CurveData2 = curvedata[1];
//            //    console.log("points close");

//            }
//            else if (circledata.Error == 2) // points too far // shouldnt really be called
//            {
//                data.Center = curvedata[0].OffPoint;
//                data.PointsOfContact = 1;
//                data.Type = 0;
//                data.CurveData1 = curvedata[0];
//                data.CurveData2 = null;
//            //    console.log("points far");
//            }
//        }
//    }

//  //  console.log("timing out");
//    return data;

//}

//export function GetCircleFrom3Points(point1, point2, point3)
//{
//    var p1 = PointLerp(point1, point2, 0.5);
//    var p2 = PointLerp(point2, point3, 0.5);
//    var n1 = ((point2.subtract(point1)).rotate(90)).normalize(1000);
//    var n2 = ((point3.subtract(point2)).rotate(90)).normalize(1000);

//    var line1 = paper.Path.Line(p1, p1.add(n1));
//    var line2 = paper.Path.Line(p2, p2.add(n2));
//    var intersects = line1.getIntersections(line2);
//    if (intersects.length == 0)
//    {
//        line1 = paper.Path.Line(p1, p1.subtract(n1));
//        line2 = paper.Path.Line(p2, p2.subtract(n2));
//        intersects = line1.getIntersections(line2);
//    }

//    if (intersects.length == 0) { return null;}

//    var center = intersects[0].point;
//    var radius = point1.getDistance(center);
//    return [center, radius];
//}

//export function GetCircleCenter(point1, point2, radius,epsilon = 1e-6)
//{
//    var absradius = Math.abs(radius);
//    var distancebetweenpoints = point1.getDistance(point2);
//    if (distancebetweenpoints < epsilon) { return { Error: 1 }; }               // need two unique points so return false
//    if (distancebetweenpoints > absradius * 2) { return { Error: 2 }; }         // points too far away so circle isn't big enough 

//    var midpoint = PointLerp(point1, point2, 0.5);
//    var middistance = point1.getDistance(midpoint);
//    var centerdistance = Math.sqrt(Math.abs((absradius * absradius) - (middistance * middistance)));
//    if (centerdistance < epsilon) { return { Center: midpoint, Valid: true, PossibleCenters: 1, Error: 0 }; } // both points only just touch the circle
//    var linetocenter = (midpoint.subtract(point1)).normalize(centerdistance);

//    if (radius > 0)
//    {
//        return { Center: (midpoint.add(linetocenter.rotate(-90))), Valid: true, PossibleCenters: 2, Error: 0 };
//    }
//    else
//    {
//        return { Center: (midpoint.add(linetocenter.rotate(90))), Valid: true, PossibleCenters: 2, Error: 0 };
//    }
//}

//export function SavePaths(paths, filename, object = { Multicolor: false, FirstPathBlack: false, StrokeWidth: 0.1, PercentageBorders: 5, SetBorder: 0 })
//{

//    if (object.Multicolor == null) { object.Multicolor = false; }
//    if (object.FirstPathBlack == null) { object.FirstPathBlack = false; }
//    if (object.StrokeWidth == null) { object.StrokeWidth = 0.1; }
//    if (object.PercentageBorders == null) { object.PercentageBorders = 5; }
//    if (object.SetBorder == null) { object.SetBorder = 0; }

//    //debugger;

//    filename = filename + ".SVG";
//    if (!util.isArray(paths)) { paths = [paths]; }

//    var color = new paper.Color(1, 0, 0);
//    var colorshift = 350 / paths.length;
//    var output = '';

//    var TopLeftPoint = new paper.Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
//    var BottemRightPoint = new paper.Point(0, 0);
//    var SizePoint;
//    for (var i = 0; i < paths.length; i++)
//    {
//        if (paths[i] != null)
//        {
//            if (paths[i].strokeColor == null)
//            {
//                paths[i].strokeColor = '#000000';
//                paths[i].strokeWidth = object.StrokeWidth;
//            }
//            if (object.Multicolor)
//            {
//                paths[i].strokeColor = color.clone();
//                color.hue += colorshift;
//            }
//            if (object.FirstPathBlack && i == 0)
//            {
//                paths[i].strokeColor = '#000000';
//            }

//            TopLeftPoint = paper.Point.min(TopLeftPoint, paths[i].bounds.topLeft);
//            BottemRightPoint = paper.Point.max(BottemRightPoint, paths[i].bounds.bottomRight);
//            output += paths[i].exportSVG({ asString: true }) + "\r\n";
//        }
//    }

//    //debugger;


//    SizePoint = (BottemRightPoint.subtract(TopLeftPoint));
//    if (SizePoint.x == 0) { SizePoint.x = 1; }
//    if (SizePoint.y == 0) { SizePoint.y = 1; }
//    if (object.PercentageBorders != 0 && object.SetBorder == 0)
//    {
//        var perc = SizePoint.multiply(object.PercentageBorders / 100);
//        BottemRightPoint = BottemRightPoint.add(perc);
//        TopLeftPoint = TopLeftPoint.subtract(perc);
//    }
//    else if (object.SetBorder != 0)
//    {
//        var perc = new paper.Point(object.SetBorder, object.SetBorder);
//        BottemRightPoint = BottemRightPoint.add(perc);
//        TopLeftPoint = TopLeftPoint.subtract(perc);
//    }
//    SizePoint = (BottemRightPoint.subtract(TopLeftPoint));
//    if (SizePoint.x == 0) { SizePoint.x = 1; }
//    if (SizePoint.y == 0) { SizePoint.y = 1; }

//    var viewportstring = "0 0 " + SizePoint.x + " " + SizePoint.y + " ";
//    var viewboxstring = " " + TopLeftPoint.x + " " + TopLeftPoint.y + " " + SizePoint.x + " " + SizePoint.y + " ";
//    output = '<svg version="1.1" baseProfile="full" viewBox="' + viewboxstring + '" viewPort="' + viewportstring + '" xmlns="http://www.w3.org/2000/svg"> \r\n' + output + "</svg>";
//    fs.writeFileSync(filename, output);
//}

//export function MakePathFromCurves(curves)
//{
//    if (!util.isArray(curves)) { curves = [curves]; }
//    if (curves.length == 0) { return null; }
//    var segs = [];
//    segs.push(curves[0].segment1);
//    for (var i = 0; i < curves.length - 1; i++)
//    {
//        segs.push(new paper.Segment(PointLerp(curves[i].point2, curves[i + 1].point1, 0.5), curves[i].segment2.handleIn, curves[i + 1].segment1.handleOut));
//    }
//    segs.push(curves[curves.length - 1].segment2);
//    return new paper.Path(segs);
//}