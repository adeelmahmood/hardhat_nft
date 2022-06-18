// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

error RandomIpfsNft__NotEnoughMintFee();
error RandomIpfsNft__WithdrawFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {

    enum TokenType {
        ETH,
        BTC,
        DAI
    }

    event NftRequested(uint256 indexed requestId, address sender);
    event NftMinted(TokenType tokenType, address minter);

    // VRF Coordinator variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint16 private constant NUM_WORDS = 1;

    // NFT variables
    uint256 private immutable i_mintFee;
    mapping(uint256 => address) private s_requestIdToSender;
    uint256 private tokenCounter;
    string[] internal s_tokenUris;
    
    constructor(
        address vrfCoordinator,
        uint256 mintFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        string[3] memory tokenUris
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("RandomIpfsNft", "RIN") {
        i_mintFee = mintFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_tokenUris = tokenUris;
    }

    function requestNft() payable public returns(uint256 requestId) {
        if(msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughMintFee();
        }

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        s_requestIdToSender[requestId] = msg.sender;

        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address sender = s_requestIdToSender[requestId];
        uint256 id = tokenCounter;
        
        TokenType tokenType = getRandomTokenType(randomWords[0]);

        _safeMint(sender, id);
        _setTokenURI(id, s_tokenUris[uint256(tokenType)]);

        emit NftMinted(tokenType, sender);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if(!success) {
            revert RandomIpfsNft__WithdrawFailed();
        }
    }

    function getRandomTokenType(uint256 random) public pure returns (TokenType) {
        uint256 index = random % 3;
        return TokenType(index);
    }

    function getMintFee() public view returns(uint256) {
        return i_mintFee;
    }

    function getTokenCounter() public view returns(uint256) {
        return tokenCounter;
    }

    function getTokenUris(uint256 index) public view returns(string memory) {
        return s_tokenUris[index];
    }
}
