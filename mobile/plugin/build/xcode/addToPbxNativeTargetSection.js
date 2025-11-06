"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToPbxNativeTargetSection = addToPbxNativeTargetSection;
function addToPbxNativeTargetSection(xcodeProject, { targetName, targetUuid, productFile, xCConfigurationList, }) {
    const target = {
        uuid: targetUuid,
        pbxNativeTarget: {
            isa: "PBXNativeTarget",
            buildConfigurationList: xCConfigurationList.uuid,
            buildPhases: [],
            buildRules: [],
            dependencies: [],
            name: `"${targetName}"`,
            productName: `"${targetName}"`,
            productReference: productFile.fileRef,
            productType: `"com.apple.product-type.application"`,
        },
    };
    xcodeProject.addToPbxNativeTargetSection(target);
    return target;
}
