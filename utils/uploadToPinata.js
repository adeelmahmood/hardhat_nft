const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

async function storeImages(imgPath) {
    const fullpath = path.resolve(imgPath);
    const files = fs.readdirSync(fullpath);
    console.log(files);
}

module.exports = { storeImages };
