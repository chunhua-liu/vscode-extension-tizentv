/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var assert = require('assert');
var testUtils = require('../testUtils');
var adapterProxy_1 = require('../../src/adapterProxy');
suite('AdapterProxy', function () {
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
    });
    suite('request', function () {
        test('if an unknown command is issued, dispatchRequest fails', function () {
            var ap = new adapterProxy_1.AdapterProxy(null, { registerEventHandler: function () { } }, null);
            return ap.dispatchRequest({ command: 'abc' }).then(function () { return assert.fail('Expected to fail'); }, function (e) {
                assert.equal(e.message, 'unknowncommand');
            });
        });
    });
});

//# sourceMappingURL=adapterProxy.test.js.map
