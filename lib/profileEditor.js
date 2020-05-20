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

function getProfileJson() {
    let profilesData = readProfilesData();
    let profilesJson = null;

    xml2js.parseString(profilesData, function (err, result) {
        profilesJson = result;
    });

    return profilesJson;
}

function syncProfileToFile(profiles) {
    let builder = new xml2js.Builder();
    let profileContent = builder.buildObject(profiles);
    fs.writeFileSync(profilePath, profileContent, 'utf-8');
}

function makeNewProfile(profileName, author, distributor1, distributor2) {
    let authorCA = author != undefined && author.hasOwnProperty('ca') ? author.ca : '';
    let authorKey = author != undefined && author.hasOwnProperty('key') ? author.key : '';
    let authorPassword = author != undefined && author.hasOwnProperty('password') ? author.password : '';

    let distributorCA1 = distributor1 != undefined && distributor1.hasOwnProperty('ca') ? distributor1.ca : '';
    let distributorKey1 = distributor1 != undefined && distributor1.hasOwnProperty('key') ? distributor1.key : '';
    let distributorPassword1 = distributor1 != undefined && distributor1.hasOwnProperty('password') ? distributor1.password : '';

    let distributorCA2 = distributor2 != undefined && distributor2.hasOwnProperty('ca') ? distributor2.ca : '';
    let distributorKey2 = distributor2 != undefined && distributor2.hasOwnProperty('key') ? distributor2.key : '';
    let distributorPassword2 = distributor2 != undefined && distributor2.hasOwnProperty('password') ? distributor2.password : '';

    let newProfileJson = null;
    let newProfileXml = `<profile name="${profileName}">
    <profileitem ca="${authorCA}" distributor="0" key="${authorKey}" password="${authorPassword}" rootca=""/>
    <profileitem ca="${distributorCA1}" distributor="1" key="${distributorKey1}" password="${distributorPassword1}" rootca=""/>
    <profileitem ca="${distributorCA2}" distributor="2" key="${distributorKey2}" password="${distributorPassword2}" rootca=""/>
    </profile>`;

    xml2js.parseString(newProfileXml, function (err, result) {
        newProfileJson = result;
    });

    return newProfileJson;
}

function createProfile(profileName, author, distributor1, distributor2, isActive) {
    let newProfile = makeNewProfile(profileName, author, distributor1, distributor2);
    let profileJson = getProfileJson();

    if (profileJson.profiles.profile == undefined) {
        profileJson.profiles.profile = new Array();
    }

    profileJson.profiles.profile.push(newProfile.profile);

    if (isActive) {
        profileJson.profiles.$.active = profileName;
    }

    syncProfileToFile(profileJson);
}

function removeProfile(profileName) {
    let profileJson = getProfileJson();
    
    if (profileJson.profiles.profile == undefined) {
        return;
    } else {
        let rmId = profileJson.profiles.profile.findIndex(profile => {
            return profile.$.name == profileName;
        });

        if (rmId >= 0) {
            profileJson.profiles.profile.splice(rmId, 1);
            if (profileJson.profiles.profile.length == 0) {
                profileJson.profiles.$.active = '';
            }
        }
    }

    syncProfileToFile(profileJson);
}

function modifyProfile(profileName, itemType, profileitem) {
    let itemIndex = itemType == 'author' ? 0 : (itemType == 'distributor1' ? 1 : 2);
    let profileJson = getProfileJson();
    
    if (profileJson.profiles.profile == undefined) {
        return;
    } else {
        let modifyId = profileJson.profiles.profile.findIndex(profile => {
            return profile.$.name == profileName;
        });

        if (modifyId >= 0) {
            profileJson.profiles.profile[modifyId].profileitem[itemIndex] = profileitem;
        }
    }

    syncProfileToFile(profileJson);
}

function isProfileExist(profileName) {
    let profileJson = getProfileJson();
    let profileExist = false;
    
    if (profileJson.profiles.profile == undefined) {
        return;
    } else {
        let modifyId = profileJson.profiles.profile.findIndex(profile => {
            return profile.$.name == profileName;
        });

        if (modifyId >= 0) {
            profileExist = true;
        }
    }

    return profileExist;
}

function activateProfile(profileName) {
    let profileJson = getProfileJson();
    
    if (profileJson.profiles.profile == undefined) {
        return;
    } else {
        let activateId = profileJson.profiles.profile.findIndex(profile => {
            return profile.$.name == profileName;
        });
    
        if (activateId >= 0) {
            profileJson.profiles.$.active = profileName;
        }
    }

    syncProfileToFile(profileJson);
}

function listProfile() {
    let profileJson = getProfileJson();

    if (profileJson.profiles.profile == undefined) {
        return null;
    } else {
        let list = new Array();
        profileJson.profiles.profile.forEach(profile => {
            list.push(profile.$.name);
        });
    
        return list;
    }
}

function getProfileKeys(profileName) {
    let profileJson = getProfileJson();

    if (profileJson.profiles.profile == undefined) {
        return null;
    } else {
        let list = new Array();
        let rmProfile = profileJson.profiles.profile.find(profile => {
            return profile.$.name == profileName;
        });

        if (rmProfile) {
            rmProfile.profileitem.forEach(item => {
                list.push(item.$.key);
            });
        }
    
        return list;
    }
}

function getProfileItems(profileName) {
    let profileJson = getProfileJson();

    if (profileJson.profiles.profile == undefined) {
        return null;
    } else {
        let item = {
            authorKey: '',
            authorPwd: '',
            distributorKey1: '',
            distributorPwd1: '',
            distributorKey2: '',
            distributorPwd2: ''
        };
        let profile = profileJson.profiles.profile.find(profile => {
            return profile.$.name == profileName;
        });

        if (profile) {
            item.authorKey = profile.profileitem[0].$.key;
            item.authorPwd = profile.profileitem[0].$.password;
            item.distributorKey1 = profile.profileitem[1].$.key;
            item.distributorPwd1 = profile.profileitem[1].$.password;
            item.distributorKey2 = profile.profileitem[2].$.key;
            item.distributorPwd2 = profile.profileitem[2].$.password;
        }

        return item;
    }
}

function getActiveProfile() {
    let profileJson = getProfileJson();
    
    if (profileJson.profiles.profile == undefined) {
        return null;
    } else {
        return profileJson.profiles.$.active;
    }
}

module.exports = {
    profilePath,
    createProfile,
    removeProfile,
    modifyProfile,
    isProfileExist,
    activateProfile,
    listProfile,
    getProfileKeys,
    getProfileItems,
    getActiveProfile
}