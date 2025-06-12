// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UniqueCardNFT.sol";
import "./MultiCardItems.sol";

contract GameManager {
    UniqueCardNFT public uniqueNFT;
    MultiCardItems public multiNFT;

    address public owner;

    uint256 public cardPackPrice; // 카드팩 가격 (wei 단위)

    event UniqueCardMinted(address indexed user, uint256 tokenId, string uri);
    event MultiCardMinted(address indexed user, uint256 typeId, string uri);

    // Unique Cards
    mapping(uint256 => bool) public uniqueCardMinted;
    uint256[] public uniqueCardIds;
    mapping(uint256 => string) public uniqueCardURIs;

    // Multi Cards
    uint256[] public multiCardIds;
    mapping(uint256 => string) public multiCardURIs;

    constructor(address _uniqueNFT, address _multiNFT, uint256 _cardPackPrice) {
        uniqueNFT = UniqueCardNFT(_uniqueNFT);
        multiNFT = MultiCardItems(_multiNFT);
        owner = msg.sender;
        cardPackPrice = _cardPackPrice;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // 카드팩 가격 설정
    function setCardPackPrice(uint256 _price) external onlyOwner {
        cardPackPrice = _price;
    }

    // Unique 카드 등록
    function addUniqueCard(uint256 tokenId, string memory uri) external onlyOwner {
        require(!uniqueCardMinted[tokenId], "Card already registered");
        //uniqueNFT.setTokenURI(tokenId, uri);
        uniqueCardIds.push(tokenId);
        uniqueCardURIs[tokenId] = uri;
    }

    // Multi 카드 타입 등록
    function addMultiCardType(string memory uri) external onlyOwner returns (uint256) {
        uint256 typeId = multiNFT.createCardType(uri);
        multiCardIds.push(typeId);
        multiCardURIs[typeId] = uri;
        return typeId;
    }

    // 카드팩 열기 (구매 및 민팅)
    function openCardPack() external payable {
        require(msg.value >= cardPackPrice, "Insufficient payment for card pack");

        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;

        if (rand < 10) {
            // 10% Legendary or Unique
            _mintUniqueCard(msg.sender);
        } else if (rand < 35) {
            // 25% Rare
            uint256 id = 3 + (rand % 2);
            _mintMultiCard(msg.sender, id);
        } else if (rand < 65) {
            // 30% Uncommon
            uint256 id = 5 + (rand % 3);
            _mintMultiCard(msg.sender, id);
        } else {
            // 35% Common
            uint256 id = 7 + (rand % 3);
            _mintMultiCard(msg.sender, id);
        }
    }

    // 내부 함수: 유니크 카드 민팅
    function _mintUniqueCard(address to) internal {
        for (uint i = 0; i < uniqueCardIds.length; i++) {
            uint256 tokenId = uniqueCardIds[i];
            if (!uniqueCardMinted[tokenId]) {
                uniqueCardMinted[tokenId] = true;

                string memory cardUri = uniqueCardURIs[tokenId];
                uniqueNFT.mint(to, tokenId);
                uniqueNFT.setTokenURI(tokenId, cardUri);

                emit UniqueCardMinted(to, tokenId, cardUri);
                return;
            }
        }
        _mintRandomMultiCard(to);
    }

    // 내부 함수: 멀티 카드 민팅
    function _mintMultiCard(address to, uint256 id) internal {
        multiNFT.mint(to, id, 1);
        emit MultiCardMinted(to, id, multiCardURIs[id]);
    }

    function _mintRandomMultiCard(address to) internal {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, to, block.prevrandao))) % 100;

        if (rand < 25) {
            // 25% Rare
            uint256 id = 3 + (rand % 2);
            _mintMultiCard(to, id);
        } else if (rand < 55) {
            // 30% Uncommon
            uint256 id = 5 + (rand % 3);
            _mintMultiCard(to, id);
        } else {
            // 45% Common
            uint256 id = 8 + (rand % 3);
            _mintMultiCard(to, id);
        }
    }

    // NFT 컨트랙트 주소 변경
    function setNFTContracts(address _uniqueNFT, address _multiNFT) external onlyOwner {
        uniqueNFT = UniqueCardNFT(_uniqueNFT);
        multiNFT = MultiCardItems(_multiNFT);
    }

    // 수익 출금
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // 유저가 가진 Unique 카드 전체 조회
    function getUserUniqueCards(address user) external view returns (uint256[] memory ids, string[] memory uris) {
        uint count = 0;
        for (uint i = 0; i < uniqueCardIds.length; i++) {
            uint256 tokenId = uniqueCardIds[i];
            if (uniqueCardMinted[tokenId] && uniqueNFT.ownerOf(tokenId) == user) {
                count++;
            }
        }

        ids = new uint256[](count);
        uris = new string[](count);

        uint index = 0;
        for (uint i = 0; i < uniqueCardIds.length; i++) {
            uint256 tokenId = uniqueCardIds[i];
            if (uniqueCardMinted[tokenId] && uniqueNFT.ownerOf(tokenId) == user) {
                ids[index] = tokenId;
                uris[index] = uniqueCardURIs[tokenId];
                index++;
            }
        }
    }

    // 유저가 가진 Multi 카드 전체 조회
    function getUserMultiCards(address user) external view returns (uint256[] memory typeIds, uint256[] memory balances, string[] memory uris) {
        uint len = multiCardIds.length;
        typeIds = new uint256[](len);
        balances = new uint256[](len);
        uris = new string[](len);

        for (uint i = 0; i < len; i++) {
            uint256 id = multiCardIds[i];
            typeIds[i] = id;
            balances[i] = multiNFT.balanceOf(user, id);
            uris[i] = multiCardURIs[id];
        }
    }
}
