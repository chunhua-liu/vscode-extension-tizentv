/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var assert = require('assert');
var lineNumberTransformer_1 = require('../../src/transformers/lineNumberTransformer');
var testUtils = require('../testUtils');
function createTransformer(clientLinesStartAt1, targetLinesStartAt1) {
    var transformer = new lineNumberTransformer_1.LineNumberTransformer(targetLinesStartAt1);
    transformer.initialize({ linesStartAt1: clientLinesStartAt1 });
    return transformer;
}
suite('LineNumberTransformer', function () {
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
    });
    var c0t0Transformer = createTransformer(false, false);
    var c0t1Transformer = createTransformer(false, true);
    var c1t0Transformer = createTransformer(true, false);
    var c1t1Transformer = createTransformer(true, true);
    suite('setBreakpoints()', function () {
        function getArgs(lines) {
            return {
                source: { path: 'test/path' },
                lines: lines
            };
        }
        function testSetBreakpoints(transformer, cLines, tLines) {
            if (tLines === void 0) { tLines = cLines; }
            var args = getArgs(cLines);
            transformer.setBreakpoints(args);
            assert.deepEqual(args, getArgs(tLines));
        }
        test('fixes args.lines', function () {
            testSetBreakpoints(c0t0Transformer, [0, 1, 2]);
            testSetBreakpoints(c0t1Transformer, [0, 1, 2], [1, 2, 3]);
            testSetBreakpoints(c1t0Transformer, [1, 2, 3], [0, 1, 2]);
            testSetBreakpoints(c1t1Transformer, [1, 2, 3]);
        });
    });
    suite('setBreakpointsResponse()', function () {
        function getResponse(lines) {
            return {
                breakpoints: lines.map(function (line) { return ({ verified: true, line: line }); })
            };
        }
        function testSetBreakpointsResponse(transformer, tLines, cLines) {
            if (cLines === void 0) { cLines = tLines; }
            var response = getResponse(tLines);
            transformer.setBreakpointsResponse(response);
            assert.deepEqual(response, getResponse(cLines));
        }
        test('fixes the breakpoints\' lines', function () {
            testSetBreakpointsResponse(c0t0Transformer, [0, 1, 2]);
            testSetBreakpointsResponse(c0t1Transformer, [1, 2, 3], [0, 1, 2]);
            testSetBreakpointsResponse(c1t0Transformer, [0, 1, 2], [1, 2, 3]);
            testSetBreakpointsResponse(c1t1Transformer, [1, 2, 3]);
        });
    });
    suite('stackTraceResponse()', function () {
        function getResponse(lines) {
            return {
                stackFrames: lines.map(function (line) { return ({ id: 0, name: '', line: line, column: 0 }); })
            };
        }
        function testStackTraceResponse(transformer, tLines, cLines) {
            if (cLines === void 0) { cLines = tLines; }
            var response = getResponse(tLines);
            transformer.stackTraceResponse(response);
            assert.deepEqual(response, getResponse(cLines));
        }
        test('fixes the stackFrames\' lines', function () {
            testStackTraceResponse(c0t0Transformer, [0, 1, 2]);
            testStackTraceResponse(c0t1Transformer, [1, 2, 3], [0, 1, 2]);
            testStackTraceResponse(c1t0Transformer, [0, 1, 2], [1, 2, 3]);
            testStackTraceResponse(c1t1Transformer, [1, 2, 3]);
        });
    });
});

//# sourceMappingURL=lineNumberTransformer.test.js.map
