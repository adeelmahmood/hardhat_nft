const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imgPath) {
    const fullpath = path.resolve(imgPath);
    const files = fs.readdirSync(fullpath);

    let responses = [];
    for (fileIndex in files) {
        const readStream = fs.createReadStream(`${fullpath}/${files[fileIndex]}`);
        try {
            console.log(`Uploading ${files[fileIndex]} to Pinata..`);
            const response = await pinata.pinFileToIPFS(readStream);
            responses.push(response);
        } catch (err) {
            console.log("storeImages error", err);
        }
    }
    return { responses, files };
}

async function storeMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (err) {
        console.log("storeMetadata error", err);
    }
}

module.exports = { storeImages, storeMetadata };
