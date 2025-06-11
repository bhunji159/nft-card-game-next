// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UniqueCardNFT is ERC721URIStorage, Ownable {

    mapping(uint256 => uint256) public tokenPrices; // 토큰 ID -> 가격

    event PriceSet(address indexed owner, uint256 indexed tokenId, uint256 price);
    event Purchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price);

    constructor() Ownable(msg.sender) ERC721("UniqueCard", "UC") {}

    // 발행
    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
        tokenPrices[tokenId] = 0;
    }

    // URI 설정
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
       require(ownerOf(tokenId) != address(0), "Nonexistent token");
        _setTokenURI(tokenId, uri);
    }

    // 가격 설정
    function setPrice(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        tokenPrices[tokenId] = price;

        emit PriceSet(msg.sender, tokenId, price);
    }

    // 거래
    function purchase(uint256 tokenId) external payable {
        address seller = ownerOf(tokenId);
        uint256 price = tokenPrices[tokenId];

        require(price > 0, "Not for sale");
        require(msg.value >= price, "Insufficient payment");
        require(seller != msg.sender, "You already own this");

        _transfer(seller, msg.sender, tokenId);

        payable(seller).transfer(price);

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        tokenPrices[tokenId] = 0;

        emit Purchased(msg.sender, seller, tokenId, price);
    }

    // URI 확인
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return super.tokenURI(tokenId);
    }

    // 가격 조회
    function getPrice(uint256 tokenId) external view returns (uint256) {
        return tokenPrices[tokenId];
    }
    
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
        tokenPrices[tokenId] = 0;
    }

}