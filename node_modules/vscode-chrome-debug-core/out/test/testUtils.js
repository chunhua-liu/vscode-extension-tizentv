/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var path = require('path');
var sinon = require('sinon');
var mockery = require('mockery');
function setupUnhandledRejectionListener() {
    process.addListener('unhandledRejection', unhandledRejectionListener);
}
exports.setupUnhandledRejectionListener = setupUnhandledRejectionListener;
function removeUnhandledRejectionListener() {
    process.removeListener('unhandledRejection', unhandledRejectionListener);
}
exports.removeUnhandledRejectionListener = removeUnhandledRejectionListener;
function unhandledRejectionListener(reason, p) {
    console.log('*');
    console.log('**');
    console.log('***');
    console.log('****');
    console.log('*****');
    console.log("ERROR!! Unhandled promise rejection, a previous test may have failed but reported success.");
    console.log(reason.toString());
    console.log('*****');
    console.log('****');
    console.log('***');
    console.log('**');
    console.log('*');
}
var MockEvent = (function () {
    function MockEvent(event, body) {
        this.event = event;
        this.body = body;
        this.seq = 0;
        this.type = 'event';
    }
    return MockEvent;
}());
exports.MockEvent = MockEvent;
/**
 * Calls sinon.mock and patches its 'expects' method to not expect that the mock base object
 * already has an implementation of the expected method.
 */
function getSinonMock(mockBase) {
    if (mockBase === void 0) { mockBase = {}; }
    var m = sinon.mock(mockBase);
    // Add a default implementation of every expected method so sinon doesn't complain if it doesn't exist.
    var originalMExpects = m.expects.bind(m);
    m.expects = function (methodName) {
        if (!mockBase[methodName]) {
            mockBase[methodName] = function () { return Promise.resolve(); };
        }
        return originalMExpects(methodName);
    };
    return m;
}
exports.getSinonMock = getSinonMock;
/**
 * Creates a sinon mock and registers it with mockery.
 * @param requireName - The import path to register with mockery
 * @param mockInstance - The object to use as a sinon mock base object
 * @param name - If specified, mock is registered as { [name]: mockInstance }. e.g. if mocking a class.
 * @param asConstructor - If true, the mock instance will be returned when the named mock is called as a constructor
 */
function createRegisteredSinonMock(requireName, mockInstance, name, asConstructor) {
    if (mockInstance === void 0) { mockInstance = {}; }
    if (asConstructor === void 0) { asConstructor = true; }
    var mock = getSinonMock(mockInstance);
    var mockContainer;
    if (name) {
        mockContainer = {};
        if (asConstructor) {
            mockContainer[name] = function () { return mockInstance; };
        }
        else {
            mockContainer[name] = mockInstance;
        }
    }
    else {
        mockContainer = mockInstance;
    }
    mockery.registerMock(requireName, mockContainer);
    return mock;
}
exports.createRegisteredSinonMock = createRegisteredSinonMock;
/**
 * Return a base Utilities mock that has Logger.log stubbed out
 */
function getDefaultUtilitiesMock() {
    return {
        Logger: { log: function () { } },
        canonicalizeUrl: function (url) { return url; }
    };
}
exports.getDefaultUtilitiesMock = getDefaultUtilitiesMock;
function registerEmptyMocks(moduleNames) {
    if (typeof moduleNames === 'string') {
        moduleNames = [moduleNames];
    }
    moduleNames.forEach(function (name) {
        mockery.registerMock(name, {});
    });
}
exports.registerEmptyMocks = registerEmptyMocks;
function getStackTraceResponseBody(aPath, lines, sourceReferences) {
    if (sourceReferences === void 0) { sourceReferences = []; }
    return {
        stackFrames: lines.map(function (line, i) { return ({
            id: i,
            name: 'line ' + i,
            line: line,
            column: 0,
            source: {
                path: aPath,
                name: path.basename(aPath),
                sourceReference: sourceReferences[i] || 0
            }
        }); })
    };
}
exports.getStackTraceResponseBody = getStackTraceResponseBody;
function win32Mocks() {
    mockery.registerMock('os', { platform: function () { return 'win32'; } });
    mockery.registerMock('path', path.win32);
}
exports.win32Mocks = win32Mocks;

//# sourceMappingURL=testUtils.js.map
