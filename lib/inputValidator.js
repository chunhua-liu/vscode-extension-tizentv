const systemPlatform = require('os').platform();
const profileEditor = require('./profileEditor');

function matchReg(value, reg) {
    let match = value.match(reg);
    if (match != null) {
        if (match.length == 1 && match[0] == value) {
            return true;
        }
    }

    return false;
}

class InputValidator {
    constructor() {}

    static checkDirectory(value) {
        if (value == undefined) {
            return 'The directory must be specified';
        }

        if (systemPlatform == 'win32') {
            let isMatch = matchReg(value, /^[a-zA-Z]:(\\[^\\^\/^:^\*^\?^\"^<^>^|]+)*\\?/g);
            if (!isMatch) {
                return 'Please check the directory format, and make sure invalid characters \\\/:*?\"<>| are not included.';
            }
        }
        else {
            let isMatch = matchReg(value, /^\/([^\/]+\/?)*/g);
            if (!isMatch) {
                return 'Please check the directory format.';
            }
        }

        return null;
    }

    static checkAppName(value) {
        if (value == undefined) {
            return 'The project name must be specified';
        }

        let isMatch = matchReg(value, '[a-zA-Z0-9]+');
        if (!isMatch) {
            return 'Use only alphabetic and numeric characters.';
        }

        return null;
    }

    static checkCertificateProfileName(value) {
        if (value == undefined) {
            return 'The profile name must be specified.';
        }

        let isMatch = matchReg(value, /[a-zA-Z-_0-9]+/);
        if (!isMatch) {
            return 'Use only alphabetic, numeric, \'-\', and \'_\' characters.';
        }

        if (profileEditor.findProfile(value) != undefined) {
            return 'A certificate profile with the same name already exists.';
        }

        return null;
    }

    static checkCertificateFileName(value) {
        if (value == '') {
            return 'The key filename must be specified.';
        }

        let isMatch = matchReg(value, /[a-zA-Z-_0-9]+/);
        if (!isMatch) {
            return 'Use only alphabetic, numeric, \'-\', and \'_\' characters.';
        }

        return null;
    }

    static checkCertificateAuthorName(value) {
        if (value == '') {
            return 'The author name must be specified.';
        }

        let isMatch = matchReg(value, /[^\+^\\^#^,^<^>^;^"]+/);
        if (!isMatch) {
            return 'This field can not contain any of the following charaters: +\\#,<>;\"';
        }

        return null;
    }
}
exports.InputValidator = InputValidator;