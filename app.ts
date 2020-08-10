
const paper = require('paper-jsdom');
paper.setup([640, 480]);
const toolbox = require('./ToolBox');
const offsett = require('./Offsetting')

//M45, 30c - 5, -10 30, -10 25, 0h5h5l - 10, 5v5c2, 2 5, 10 0, 10v5c0, -10 - 25, -10 - 25, 0v - 5l5, -5l - 10, -10z


var path1 = new paper.Path("M45, 30 c -5, -10 30, -10 25, 0 h5 h5 l -10, 5 v5 c 2, 2 5, 10 0, 10 v5 c0, -10 -25, -10 -25, 0v -5l5, -5l -10, -10 L45,30z");
var path2 = new paper.Path("M0, 0  h35 v25 h-5 v-10 h-25 v25 h10 v5 h-25 v-35 z");
var path3 = new paper.Path("M0,0 h5 v5 h-10 v5 h5")
var path4 = new paper.CompoundPath("M0,0 h50 v50 h-50 v-50z M10,10 v10 h10 v-10 h-10z");
var path5 = new paper.Path("M0,0 h5 v5 v-5 h5 v-5 v5 h5");


//export function OffsetPath(path, offset1, offset2, type, straightnesstolerance = Number.MAX_SAFE_INTEGER, lengthtolerance = Number.MAX_SAFE_INTEGER, epsilon = 1e-9, epsilonpercentaage = 1e-9)

//path1.reverse();

var paths = [path3];


// 0 = simplest offset
// 1 = closed path offset
// 2 = openpath turn to stroke // must be posative offsets
var type = 2;

for (var i =1; i <=3; i+=0.25) // 45
{
console.log("doing " + i);
    paths = paths.concat(offsett.OffsetPath(paths[0], i, -i, type, 0.1, 5));
}
//paths = paths.concat(offsett.OffsetPath(paths[0], 2, -2, type, 0.1, 5));

toolbox.SavePaths(paths, "00", { Multicolor: true, FirstPathBlack: true });