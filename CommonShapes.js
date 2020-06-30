"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const paper = require('paper-jsdom');
/*
 * Just some ways of getting predesigned paths for testing
 */
function GetCompoundTestShapes(id) {
    var path = new paper.CompoundPath();
    if (id == 1) {
        var tp1 = new paper.Path();
        tp1.moveTo([50, 50]);
        tp1.lineBy([20, 0]);
        tp1.lineBy([0, 15]);
        tp1.lineBy([10, 0]);
        tp1.lineBy([0, -15]);
        tp1.lineBy([20, 0]);
        tp1.lineBy([0, 20]);
        tp1.lineBy([-50, 0]);
        tp1.lineBy([0, -20]);
        tp1.closePath();
        var tp2 = new paper.Path();
        tp2.moveTo([90, 55]);
        tp2.lineBy([0, 5]);
        tp2.lineBy([5, 0]);
        tp2.lineBy([0, -5]);
        tp2.lineBy([-5, 0]);
        tp2.closePath();
        var tp3 = new paper.Path();
        tp3.moveTo([90, 63]);
        tp3.lineBy([0, 5]);
        tp3.lineBy([5, 0]);
        tp3.lineBy([0, -5]);
        tp3.lineBy([-5, 0]);
        tp3.closePath();
        path.addChild(tp1);
        path.addChild(tp2);
        path.addChild(tp3);
    }
    else if (id == 2) {
        var tp1 = new paper.Path();
        tp1.moveTo([0, 0]);
        tp1.lineBy([10, 0]);
        tp1.lineBy([0, 10]);
        tp1.lineBy([-10, 0]);
        tp1.lineBy([0, -10]);
        tp1.closePath();
        var tp2 = new paper.Path();
        tp2.moveTo([20, 0]);
        tp2.lineBy([10, 0]);
        tp2.lineBy([0, 10]);
        tp2.lineBy([-10, 0]);
        tp2.lineBy([0, -10]);
        tp2.closePath();
        path.addChild(tp1);
        path.addChild(tp2);
    }
    return path;
}
exports.GetCompoundTestShapes = GetCompoundTestShapes;
function GetTestShapes(id) {
    var path = new paper.Path();
    if (id == 1) {
        path.moveTo([45, 30]);
        path.cubicCurveBy([-5, -10], [30, -10], [25, 0]);
        path.lineBy([5, 0]);
        path.lineBy([5, 0]);
        path.lineBy([-10, 5]);
        path.lineBy([0, 5]);
        path.cubicCurveBy([2, 2], [5, 10], [0, 10]);
        path.lineBy([0, 5]);
        path.cubicCurveBy([0, -10], [-25, -10], [-25, 0]);
        path.lineBy([0, -5]);
        path.lineBy([5, -5]);
        path.lineBy([-10, -10]);
        path.lineBy([5, -5]);
        path.closePath();
    }
    else if (id == 2) {
        path.moveTo([50, 50]);
        path.lineBy([-5, 5]);
        path.lineBy([10, 10]);
        path.lineBy([10, -10]);
        path.lineBy([-5, -5]);
        path.lineBy([5, -5]);
        path.lineBy([10, 10]);
        path.lineBy([-20, 20]);
        path.lineBy([-20, -20]);
        path.lineBy([10, -10]);
        path.lineBy([5, 5]);
        path.closePath();
    }
    else if (id == 3) {
        path.moveTo([50, 50]);
        path.lineBy([20, 0]);
        path.lineBy([0, 15]);
        path.lineBy([10, 0]);
        path.lineBy([0, -15]);
        path.lineBy([20, 0]);
        path.lineBy([0, 20]);
        path.lineBy([-50, 0]);
        path.closePath();
    }
    return path;
}
exports.GetTestShapes = GetTestShapes;
//# sourceMappingURL=CommonShapes.js.map