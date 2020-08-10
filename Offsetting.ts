

const paper = require('paper-jsdom');
const toolbox = require('./ToolBox');
const util = require('util');

export { }




export function OffsetPath(path, offset1, offset2, type, straightnesstolerance = Number.MAX_SAFE_INTEGER, lengthtolerance = Number.MAX_SAFE_INTEGER, epsilon = 1e-9, epsilonpercentaage = 1e-3)
{
    var initalpaths = toolbox.SplitCompoundIntoArray(path);
    var offsetpaths = [];
    var returnpath;
    var closedpath = false;
    var unite = false;
    var makeintostroke = false;

    function SetType(t)
    {
        if (t == 0)
        {
            closedpath = false;
            unite = false;
            makeintostroke = false;
        }
        else if (t == 1)
        {
            closedpath = path.closed;
            unite = true;
            makeintostroke = false;
        }
        else if (t == 2)
        {
            closedpath = false;// path.closed;
            unite = true;
            makeintostroke = true;
        }
            unite = false;
    }

  
    SetType(type);

    for (var i = 0; i < initalpaths.length; i++)
    {

            offsetpaths = offsetpaths.concat(OffsetCurves(initalpaths[i].clone().curves, offset1, offset2, closedpath, unite, path.clockwise, makeintostroke, straightnesstolerance, lengthtolerance, epsilon, epsilonpercentaage));
    }

    if (!unite)
    {
        return offsetpaths;
    }
    if (unite)
    {
        offsetpaths = offsetpaths.filter(function (ob) { return ob != null; });
        offsetpaths = offsetpaths.filter(function (ob) { return ob.curves.length > 0; });

        /// so with number 2 


        offsetpaths.sort(function (a, b) { return Number(b.clockwise) - Number(a.clockwise); })
        if (offsetpaths.length == 0) { return null; }
        if (offsetpaths[0] == null) { return null; }
        if (!offsetpaths[0].clockwise) { return null; } // only holes cant be a real thing

        //  return offsetpaths;
        debugger;

        returnpath = offsetpaths[0];
        for (var i = 1; i < offsetpaths.length; i++)
        {
            if (offsetpaths[i].clockwise)
            {
                returnpath = returnpath.unite(offsetpaths[i]);
            }
            else
            {
                returnpath = returnpath.subtract(offsetpaths[i]);
            }
        }
        debugger;
    }
    return returnpath;
}

export function OffsetCurves(curves, offset1, offset2, closedpath, unite, clockwise, makeintostroke = false, straightnesstolerance = Number.MAX_SAFE_INTEGER, lengthtolerance = Number.MAX_SAFE_INTEGER, epsilon = 1e-9, epsilonpercentaage = 1e-9)
{
    if (curves.length < 1 || (offset1 == 0 && offset2 == 0)) { return null; }

    var debugpaths = [];

    var openpathint = Number(!closedpath);
    var curvestotallength = 0;
    var trimtimes = [];
    var curvepairs = [];
    var offsets = [];
    var kissinglist = [];
    var numberofvalidcurves = null;

    function splitcurvesatpeaks()
    {
        for (var i = 0; i < curves.length; i++)
        {
            curvestotallength += curves[i].length;
            if (!curves[i].isStraight())
            {
                var times = paper.Curve.getPeaks(curves[i].getValues()).concat(curves[i].classify().roots);
                times = times.filter(Number);
                times.sort(function (a, b) { return a - b; });
                curves.splice(i, 1, ...toolbox.SplitCurveAtTimes(curves[i], times));
                i += times.length;
            }
        }
        numberofvalidcurves = curves.length;
    }
    function populateoffsets()
    {
        var offsetchangeperunit = (offset2 - offset1) / curvestotallength;
        var templength = 0;
        for (var i = 0; i < curves.length; i++)
        {
            offsets.push([offset1 + (templength * offsetchangeperunit), offset1 + ((templength += curves[i].length) * offsetchangeperunit)]);
        }
    }
    function populatecurvepairsandtrimtimes()
    {
        for (var i = 0; i < curves.length; i++)
        {
            trimtimes.push([0, 1, true]);
            if (i < curves.length - openpathint)
            {
                curvepairs.push([i, toolbox.MIB(i + 1, curves.length), null]);
            }
        }
    }
    function turnintostroke()
    {
        var offsetstart = offsets.length - 1;
        for (var i = offsetstart; i >= 0; i--)
        {
            offsets.push([offsets[i][1], offsets[i][0]]);

            curves.push(curves[i].clone().reversed());
        }
        closedpath = true;
        openpathint = 0;
    }
    function calculatetrimtimes()
    {
        for (var i = 0; i < curvepairs.length; i++)
        {
            var index1 = curvepairs[i][0];
            var index2 = curvepairs[i][1];
            var kissingcircle = toolbox.GetKissingDataForCurvePair(curves[index1], curves[index2], offsets[index1][1], clockwise, curvepairs[i][2], epsilon);

            if (index2 == toolbox.MIB(index1 + 1, curves.length))
            {
                kissinglist.push(kissingcircle);
            }

            if (kissingcircle.Type == -1)
            {
                if (trimtimes[index1][1] > kissingcircle.Time1) { trimtimes[index1][1] = kissingcircle.Time1; }
                if (trimtimes[index2][0] < kissingcircle.Time2) { trimtimes[index2][0] = kissingcircle.Time2; }

                if (trimtimes[index1][0] < trimtimes[index1][1] != trimtimes[index1][2]) { trimtimes[index1][2] = false; numberofvalidcurves--; }
                if (trimtimes[index2][0] < trimtimes[index2][1] != trimtimes[index2][2]) { trimtimes[index2][2] = false; numberofvalidcurves--; }

                if (numberofvalidcurves == 0)
                {
                    return false;
                }

                if (!trimtimes[index1][2] && !trimtimes[index2][2])
                {
                    addtocurvepairs(index1, index2, -1, +1, kissingcircle.Center, i);
                }
                else if (!trimtimes[index1][2])
                {
                    addtocurvepairs(index1, index2, -1, 0, kissingcircle.Center, i);
                }
                else if (!trimtimes[index2][2])
                {
                    addtocurvepairs(index1, index2, 0, 1, kissingcircle.Center, i);
                }
            }
        }
        return true;
    }
    function addtocurvepairs(index1, index2, change1, change2, startingposistion, curvepairindex)
    {
        var newindex1 = toolbox.MIB(index1 + change1, curves.length);
        var newindex2 = toolbox.MIB(index2 + change2, curves.length);
        if (!closedpath && newindex2 < newindex1) { return; }
        if (newindex1 == index2 || newindex2 == index1 || newindex1 == newindex2) { return; }
        for (var i = 0; i < curvepairs.length; i++)
        {
            if (curvepairs[i][0] == newindex1 && curvepairs[i][1] == newindex2) { return; }
        }
        curvepairs.splice(curvepairindex + 1, 0, [newindex1, newindex2, startingposistion]);
    }
    function getindexoffirstvalidcurve()
    {
        for (var i = 0; i < curves.length; i++)
        {
            if (trimtimes[i][2]) { return i; }
        }
    }
    function createpath()
    {
        var startindex = getindexoffirstvalidcurve();
        var startpos = null;
        var endpos = null;
        var kissdata = [];
        var finalcurves = [];

        for (var i = startindex; i < startindex + curves.length; i++)
        {
            var index = toolbox.MIB(i, curves.length);
            if (trimtimes[index][2] == true)
            {
                var tempcurves = OffsetCurve(curves[index], offsets[index][0], offsets[index][1], trimtimes[index], straightnesstolerance, lengthtolerance);
                endpos = tempcurves[0].point1

                if (kissdata.length > 0)
                {
                    var tpath = createpathfromkisses(startpos, endpos, kissdata);
                    finalcurves = finalcurves.concat(tpath.curves);
                }
                finalcurves = finalcurves.concat(tempcurves);
                kissdata = [];
                startpos = tempcurves[tempcurves.length - 1].point2;
            }
            if (kissinglist[index] != null)
            {
                if (kissinglist[index].Type == 1)
                {
                    kissdata.push(kissinglist[index]);
                }
            }
        }
        if (kissdata.length > 0 && closedpath)
        {
            endpos = finalcurves[0].point1;
            var tpath = createpathfromkisses(startpos, endpos, kissdata);
            finalcurves = finalcurves.concat(tpath.curves);
        }
        return toolbox.MakePathFromCurves(finalcurves, closedpath);
    }
    function createpathfromkisses(startpoint, endpoint, kissdata)
    {
        var startindex = -1;
        var endindex = -1;
        var beststarterror = Number.MAX_SAFE_INTEGER;
        var bestenderror = Number.MAX_SAFE_INTEGER;
        var path = new paper.Path();
        path.moveTo(startpoint);

        for (var i = 0; i < kissdata.length; i++)
        {
            var tempstarterror = Math.abs((startpoint.getDistance(kissdata[i].OriginalPoint)) - (Math.abs(kissdata[i].Radius)));
            var tempenderror = Math.abs((endpoint.getDistance(kissdata[i].OriginalPoint)) - (Math.abs(kissdata[i].Radius)));

            if (tempstarterror < beststarterror)
            {
                beststarterror = tempstarterror;
                startindex = i;
            }
            if (tempenderror < bestenderror)
            {
                bestenderror = tempenderror;
                endindex = i;
            }
        }

        for (var i = startindex; i <= endindex; i++)
        {
            var currentpoint = path.lastSegment.point;
            var bestdirection = null;
            var bestintersectpoint = null;
            var nextindex = -1;
            var nextarcpoint = null;

            for (var ii = i + 1; ii <= endindex; ii++)
            {
                var intersectpoint = toolbox.FindCircleCircleintersection(kissdata[i].OriginalPoint, kissdata[i].Radius, kissdata[ii].OriginalPoint, kissdata[ii].Radius);

                var arcmiddle = toolbox.getarcmiddle(currentpoint, kissdata[i].OriginalPoint, intersectpoint, kissdata[i].Tangent);
                var arcdirection = intersectpoint.subtract(currentpoint);

                if (bestdirection == null || bestdirection.getDirectedAngle(arcdirection) < 0)
                {
                    bestintersectpoint = intersectpoint;
                    nextindex = ii;
                    nextarcpoint = arcmiddle;
                    bestdirection = arcdirection;
                }
            }
            if (bestdirection == null)
            {
                nextarcpoint = toolbox.getarcmiddle(currentpoint, kissdata[i].OriginalPoint, endpoint, kissdata[i].Tangent);
                bestintersectpoint = endpoint;
            }

            if (nextindex != -1) { i = nextindex - 1; }

            if (!bestintersectpoint.isClose(currentpoint, 1e-6))
            {
                path.arcTo(nextarcpoint, bestintersectpoint);
            }
        }
        return path;
    }


    splitcurvesatpeaks();
    populateoffsets();
    if (makeintostroke) { turnintostroke(); }
    populatecurvepairsandtrimtimes();

    if (!calculatetrimtimes())
    {
        return null;
    }

    var finalpath = createpath();

    if (unite)
    {
        var originalclockwise = finalpath.clockwise;
        finalpath = finalpath.unite(finalpath);
        if (finalpath.clockwise != originalclockwise) { finalpath.reverse(); }
        var subpaths = toolbox.SplitCompoundIntoArray(finalpath);

        if (subpaths.length > 1)
        {

            for (var ii = 0; ii < kissinglist.length; ii++)
            {
                var radius = Math.abs(kissinglist[ii].Radius);
                var allowederror = radius * epsilonpercentaage;
                for (var i = subpaths.length - 1; i >= 0; i--)
                {
                    var closestpoint = subpaths[i].getNearestPoint(kissinglist[ii].OriginalPoint);
                    var error = radius - (kissinglist[ii].OriginalPoint.getDistance(closestpoint));

                    if (error > allowederror)
                    {
                        subpaths.splice(i, 1);
                    }
                }
            }
            return debugpaths.concat(subpaths);
        }
    }

    return debugpaths.concat(finalpath);
}


export function OffsetCurve(curve, offset1, offset2, trimtimes, straightnesstolerance, lengthtolerance)
{
    if (trimtimes[0] > 0 && trimtimes[1] < 1)
    {
        curve = toolbox.SplitCurveAtTimes(curve, trimtimes)[1];
    }
    else if (trimtimes[0] > 0)
    {
        curve = toolbox.SplitCurveAtTimes(curve, trimtimes[0])[1];
    }
    else if (trimtimes[1] < 1)
    {
        curve = toolbox.SplitCurveAtTimes(curve, trimtimes[1])[0];
    }
    var tempcurves = toolbox.SplitCurveForTolerance(curve, straightnesstolerance, lengthtolerance);
    var offsetchangeperunit = ((offset2 - offset1) / curve.length);
    var tempdistance = 0;
    for (var i = 0; i < tempcurves.length; i++)
    {
        tempcurves[i] = OffsetCurveAverage(tempcurves[i], offset1 + (tempdistance * offsetchangeperunit), offset1 + ((tempdistance += tempcurves[i].length) * offsetchangeperunit))
    }
    return tempcurves;
}

/* taken from lehni, slightly modified - should not large offset curves sometimes have messed up handles */
export function OffsetCurveAverage(curve, offset1, offset2)
{
    var offset12 = ((offset2 - offset1) / 2) + offset1;
    var v = curve.getValues(),
        p1 = curve.point1.add(paper.Curve.getNormal(v, 0).multiply(offset1)),
        p2 = curve.point2.add(paper.Curve.getNormal(v, 1).multiply(offset2)),
        t = toolbox.getAverageTangentTimeOfCurve(v),
        u = 1 - t,
        pt = paper.Curve.getPoint(v, t).add(
            paper.Curve.getNormal(v, t).multiply(offset12)),
        t1 = paper.Curve.getTangent(v, 0),
        t2 = paper.Curve.getTangent(v, 1),
        div = t1.cross(t2) * 3 * t * u,
        v = pt.subtract(
            p1.multiply(u * u * (1 + 2 * t)).add(
                p2.multiply(t * t * (3 - 2 * t)))),
        a = v.cross(t2) / (div * u),
        b = v.cross(t1) / (div * t);
    if (curve.isStraight()) { return new paper.Curve(p1, new paper.Point(0, 0), new paper.Point(0, 0), p2); }
    return new paper.Curve(p1, t1.multiply(a), t2.multiply(-b), p2);
}
