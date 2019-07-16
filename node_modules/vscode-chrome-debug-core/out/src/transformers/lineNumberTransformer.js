/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
/**
 * Converts from 1 based lines on the client side to 0 based lines on the target side
 */
var LineNumberTransformer = (function () {
    function LineNumberTransformer(targetLinesStartAt1) {
        this._targetLinesStartAt1 = targetLinesStartAt1;
    }
    LineNumberTransformer.prototype.initialize = function (args) {
        this._clientLinesStartAt1 = args.linesStartAt1;
    };
    LineNumberTransformer.prototype.setBreakpoints = function (args) {
        var _this = this;
        args.lines = args.lines.map(function (line) { return _this.convertClientLineToTarget(line); });
    };
    LineNumberTransformer.prototype.setBreakpointsResponse = function (response) {
        var _this = this;
        response.breakpoints.forEach(function (bp) { return bp.line = _this.convertTargetLineToClient(bp.line); });
    };
    LineNumberTransformer.prototype.stackTraceResponse = function (response) {
        var _this = this;
        response.stackFrames.forEach(function (frame) { return frame.line = _this.convertTargetLineToClient(frame.line); });
    };
    LineNumberTransformer.prototype.convertClientLineToTarget = function (line) {
        if (this._targetLinesStartAt1) {
            return this._clientLinesStartAt1 ? line : line + 1;
        }
        return this._clientLinesStartAt1 ? line - 1 : line;
    };
    LineNumberTransformer.prototype.convertTargetLineToClient = function (line) {
        if (this._targetLinesStartAt1) {
            return this._clientLinesStartAt1 ? line : line - 1;
        }
        return this._clientLinesStartAt1 ? line + 1 : line;
    };
    return LineNumberTransformer;
}());
exports.LineNumberTransformer = LineNumberTransformer;

//# sourceMappingURL=lineNumberTransformer.js.map
