const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const profilePath =  path.resolve(__dirname, '..', 'resource', 'profiles.xml');

function createProfilesXml() {
    let emptyContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <profiles active="" version="3.1">
    </profiles>`;

    fs.writeFileSync(profilePath, emptyContent, {encoding: 'utf-8'});
}

function readProfilesData() {
    if (!fs.existsSync(profilePath)) {
        createProfilesXml();
    }

    return fs.readFileSync(profilePath, {encoding: 'utf-8'});
}

function newProfile(profileName) {
    let profileItem = {$: { ca: '', distributor: '', key: '', password: '', rootca: '' }};
    let profile = { $: { name: `${profileName}` }, profileitem: [profileItem, profileItem, profileItem] };

    return profile;
}
exports.newProfile = newProfile;

function writeProfile(profile) {
    xml2js.parseString(readProfilesData(), function (err, result) {
        if (result.profiles.profile != undefined) {
            result.profiles.profile.push(profile);
        } else {
            result.profiles.profile = new Array(profile);
        }

        let builder = new xml2js.Builder();
        let profileContent = builder.buildObject(result);
        fs.writeFileSync(profilePath, profileContent, 'utf-8');
    });
}
exports.writeProfile = writeProfile;

function removeProfile(profileName) {
    xml2js.parseString(readProfilesData(), function (err, result) {
        if (result.profiles.profile != undefined) {
            let rmId = result.profiles.profile.findIndex(profile => {
                profile.$.name == profileName;
            });

            if (rmId >= 0) {
                result.profiles.profile.splice(rmId);

                let builder = new xml2js.Builder();
                let profileContent = builder.buildObject(result);
                fs.writeFileSync(profilePath, profileContent, 'utf-8');
            }
        } 
    });
}
exports.removeProfile = removeProfile;

function findProfile(profileName) {
    let profile = undefined;
    xml2js.parseString(readProfilesData(), function (err, result) {
        console.log(result);
        if (result.profiles.profile != undefined) {
            profile = result.profiles.profile.find(profile => {
                profile.$.name == profileName;
            });
        } 
    });

    return profile;
}
exports.findProfile = findProfile;

function setProfileItem(profile, profileItem) {
    if (profileItem.hasOwnProperty('ca')) {
        profile.profileitem[0].$.ca = profileItem.ca;
    }
    if (profileItem.hasOwnProperty('distributor')) {
        profile.profileitem[0].$.distributor = profileItem.distributor;
    }
    if (profileItem.hasOwnProperty('key')) {
        profile.profileitem[0].$.key = profileItem.key;
    }
    if (profileItem.hasOwnProperty('password')) {
        profile.profileitem[0].$.password = profileItem.password;
    }
    if (profileItem.hasOwnProperty('rootca')) {
        profile.profileitem[0].$.rootca = profileItem.rootca;
    }
    
    return profile;
}
exports.setProfileItem = setProfileItem;

function setActiveProfile(profileName) {
    xml2js.parseString(readProfilesData(), function (err, result) {
        if (result.profiles.profile != undefined) {
            let rmId = result.profiles.profile.findIndex(profile => {
                profile.$.name == profileName;
            });

            if (rmId >= 0) {
                result.profiles.$.active = profileName;

                let builder = new xml2js.Builder();
                let profileContent = builder.buildObject(result);
                fs.writeFileSync(profilePath, profileContent, 'utf-8');
            }
        } 
    });
}
exports.setActiveProfile = setActiveProfile;