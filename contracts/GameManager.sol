// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UniqueCardNFT.sol";
import "./MultiCardItems.sol";

contract GameManager {
    UniqueCardNFT public uniqueNFT;
    MultiCardItems public multiNFT;

    address public owner;

    // Unique Cards
    mapping(uint256 => bool) public uniqueCardMinted;
    uint256[] public uniqueCardIds;
    mapping(uint256 => string) public uniqueCardURIs;

    // Multi Cards
    uint256[] public multiCardIds;
    mapping(uint256 => string) public multiCardURIs;

    constructor(address _uniqueNFT, address _multiNFT) {
        uniqueNFT = UniqueCardNFT(_uniqueNFT);
        multiNFT = MultiCardItems(_multiNFT);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // Unique 등록
    function addUniqueCard(uint256 tokenId, string memory uri) external onlyOwner {
        require(!uniqueCardMinted[tokenId], "Card already registered");
        uniqueCardIds.push(tokenId);
        uniqueCardURIs[tokenId] = uri;
    }

    // MultiCard 등록
    function addMultiCardType(string memory uri) external onlyOwner returns (uint256) {
        uint256 typeId = multiNFT.createCardType(uri);
        multiCardIds.push(typeId);
        multiCardURIs[typeId] = uri;
        return typeId;
    }

    // 카드팩 열기
    function openCardPack() external {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;

        if (rand < 10) {
            // 10% Legendary or Unique
            _mintUniqueCard(msg.sender);
        } else if (rand < 35) {
            // 25% Rare
            uint256 id = 2 + (rand % 2);
            _mintMultiCard(msg.sender, id);
        } else if (rand < 65) {
            // 30% Uncommon
            uint256 id = 4 + (rand % 2);
            _mintMultiCard(msg.sender, id);
        } else {
            // 35% Common
            uint256 id = 6 + (rand % 2);
            _mintMultiCard(msg.sender, id);
        }
    }

    function _mintUniqueCard(address to) internal {
        for (uint i = 0; i < uniqueCardIds.length; i++) {
            uint256 tokenId = uniqueCardIds[i];
            if (!uniqueCardMinted[tokenId]) {
                uniqueCardMinted[tokenId] = true;

                string memory cardUri = uniqueCardURIs[tokenId];
                uniqueNFT.mint(to, tokenId);
                uniqueNFT.setTokenURI(tokenId, cardUri);

                return;
            }
        }
        revert("All unique cards minted");
    }

    function _mintMultiCard(address to, uint256 id) internal {
        multiNFT.mint(to, id, 1);
    }

    function setNFTContracts(address _uniqueNFT, address _multiNFT) external onlyOwner {
        uniqueNFT = UniqueCardNFT(_uniqueNFT);
        multiNFT = MultiCardItems(_multiNFT);
    }
}