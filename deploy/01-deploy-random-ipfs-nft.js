const { network } = require("hardhat");
const { developmentChains, networkConfig } = require("../hardhat-helper-config");
const { storeImages } = require("../utils/uploadToPinata");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = getNamedAccounts();

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
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    const arguments = [
        vrfCoordinatorV2Address,
        networkConfig[chainId].mintFee,
        networkConfig[chainId].gasLane,
        subscriptionId,
        networkConfig[chainId].callbackGasLimit,
        [],
    ];

    const BLOCK_CONFIRMATIONS = developmentChains.includes(network.name) ? 1 : 6;

    // const contract = await deploy("RandomIpfsNft", {
    //     from: deployer,
    //     args: arguments,
    //     log: true,
    //     waitConfirmations: BLOCK_CONFIRMATIONS,
    // });

    // if (!developmentChains.includes(network.name) && process.env.ETHER_SCAN_KEY) {
    //     log("Verifying...");
    //     await verify(contract.address, arguments);
    // }
    log("------------------------------------------");

    await storeImages("./images");
};

module.exports.tags = ["all", "nft"];
