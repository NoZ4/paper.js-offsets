/// main function just to test offsetting
const paper = require('paper-jsdom');
const toolbox = require('./ToolBox');
const commonshapes = require('./CommonShapes');
const extensions = require('./PaperJsExtensions');
paper.setup([640, 480]);
TestProduct();
function TestProduct() {
    var paths = [];
    //  var path = commonshapes.GetTestShapes(3);
    var path = commonshapes.GetCompoundTestShapes(2);
    paths.push(path);
    for (var i = -100; i <= 100; i += 1) {
        if (i != 0) {
            console.log("i is " + i);
            var p = path.Offset(i, i);
            if (p != null) {
                paths = paths.concat(p);
            }
        }
    }
    toolbox.SavePaths(paths, "00", true, true);
}
//# sourceMappingURL=ProductGenerator.js.map