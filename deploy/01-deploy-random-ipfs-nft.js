const { network } = require("hardhat");
const { developmentChains, networkConfig } = require("../hardhat-helper-config");
const { storeImages, storeMetadata } = require("../utils/uploadToPinata");
const { verify } = require("../utils/verify");

const IMAGES_LOCATION = "./images";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("1");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let tokenUris = [
        "ipfs://QmdwJ23vVttro1tL1gaitQk6ygW8dhNYawMUtfvPPB1wAt",
        "ipfs://QmUnvLcSdUvxKgeZ8nT1JtcHR8yS1j992DyvCDyhoGDcao",
        "ipfs://QmW8oGCKHEpMK56wMrvTDrni7eQ9xdrx7KNMKEyGoQExfz",
    ];

    const chainId = network.config.chainId;

    let vrfCoordinatorV2Address;
    const gasLane = networkConfig[chainId].gasLane;
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
    let subscriptionId;

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

        // get subscription id
        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const receipt = await tx.wait();
        subscriptionId = receipt.events[0].args.subId;

        //fund mocked subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = tokenUris();
    }

    const arguments = [
        vrfCoordinatorV2Address,
        networkConfig[chainId].mintFee,
        networkConfig[chainId].gasLane,
        subscriptionId,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
    ];

    const BLOCK_CONFIRMATIONS = developmentChains.includes(network.name) ? 1 : 6;

    const contract = await deploy("RandomIpfsNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: BLOCK_CONFIRMATIONS,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHER_SCAN_KEY) {
        log("Verifying...");
        await verify(contract.address, arguments);
    }
    log("------------------------------------------");
};

async function tokenUris() {
    tokenUris = [];

    const metadataTemplate = {
        name: "",
        description: "",
        image: "",
        attributes: [
            {
                trait_type: "reputation",
                value: 1,
            },
        ],
    };

    const { responses: filesResponse, files } = await storeImages(IMAGES_LOCATION);
    for (responseIndex in filesResponse) {
        let metadata = { ...metadataTemplate };

        metadata.name = files[responseIndex].replace(".png", "");
        metadata.description = `A ${metadata.name} token`;
        metadata.image = `ipfs://${filesResponse[responseIndex].IpfsHash}`;

        const metadataResponse = await storeMetadata(metadata);
        tokenUris.push(`ipfs://${metadataResponse.IpfsHash}`);
    }

    console.log(tokenUris);
    return tokenUris;
}

module.exports.tags = ["all", "nft"];
