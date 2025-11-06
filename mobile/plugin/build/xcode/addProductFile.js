"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProductFile = addProductFile;
function addProductFile(xcodeProject, { targetName, groupName }) {
    const options = {
        basename: `${targetName}`,
        group: groupName,
        explicitFileType: "wrapper.application",
        settings: {
            ATTRIBUTES: ["RemoveHeadersOnCopy"],
        },
        includeInIndex: 0,
        path: `${targetName}`,
        sourceTree: "BUILT_PRODUCTS_DIR",
    };
    const productFile = xcodeProject.addProductFile(targetName, options);
    return productFile;
}
