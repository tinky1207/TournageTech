"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPbxGroup = addPbxGroup;
function addPbxGroup(xcodeProject, { targetName }) {
    const { uuid: pbxGroupUuid } = xcodeProject.addPbxGroup([
        "ContentView.swift",
        "SampleWatchApp.swift",
        "ViewModel.swift",
        "Assets.xcassets",
        "Preview Assets.xcassets",
    ], `"${targetName}"`, `"../${targetName}"`);
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    if (pbxGroupUuid) {
        Object.keys(groups).forEach(function (key) {
            if (groups[key].name === undefined && groups[key].path === undefined) {
                xcodeProject.addToPbxGroup(pbxGroupUuid, key);
            }
        });
    }
}
