// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiCardItems is ERC1155URIStorage, Ownable {
    uint256 public nextTypeId = 1;
    mapping(uint256 => uint256) public totalMinted; // id -> 발행된 수량
    mapping(address => mapping(uint256 => uint256)) public prices; // 소유자 주소 -> (id -> 가격)

    uint256 public constant MAX_SUPPLY_PER_TYPE = 20;

    event PriceSet(address indexed seller, uint256 indexed typeId, uint256 price);
    event Purchased(address indexed buyer, address indexed seller, uint256 indexed typeId, uint256 amount, uint256 totalPrice);

    constructor() Ownable(msg.sender) ERC1155("") {}

    // 카드 타입 생성 및 URI 지정 (id 자동 증가)
    function createCardType(string memory cardURI) external onlyOwner returns (uint256) {
        uint256 typeId = nextTypeId++;
        _setURI(typeId, cardURI);
        return typeId;
    }

    // 발행
    function mint(address to, uint256 typeId, uint256 amount) external onlyOwner {
        require(_isValidTypeId(typeId), "Invalid typeId");
        require(totalMinted[typeId] + amount <= MAX_SUPPLY_PER_TYPE, "Exceeds max supply");

        totalMinted[typeId] += amount;
        _mint(to, typeId, amount, "");

        prices[to][typeId] = 0;
    }

    // 가격 설정
    function setPrice(uint256 typeId, uint256 priceWei) external {
        require(balanceOf(msg.sender, typeId) > 0, "You don't own this type");
        prices[msg.sender][typeId] = priceWei;

        emit PriceSet(msg.sender, typeId, priceWei);
    }

    // 가격 조회
    function getPrice(address seller, uint256 typeId) external view returns (uint256) {
        return prices[seller][typeId];
    }

    // 카드 구매
    function purchase(address seller, uint256 typeId, uint256 amount) external payable {
        require(_isValidTypeId(typeId), "Invalid typeId");
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(seller, typeId) >= amount, "Seller lacks balance");

        uint256 price = prices[seller][typeId];
        require(price > 0, "Not for sale");
        uint256 totalPrice = price * amount;
        require(msg.value >= totalPrice, "Insufficient ETH");

        // Transfer NFT
        _safeTransferFrom(seller, msg.sender, typeId, amount, "");

        // Pay seller
        payable(seller).transfer(totalPrice);

        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit Purchased(msg.sender, seller, typeId, amount, totalPrice);
    }

    // 발행 가능 수량 조회
    function remainingSupply(uint256 typeId) external view returns (uint256) {
        require(_isValidTypeId(typeId), "Invalid typeId");
        return MAX_SUPPLY_PER_TYPE - totalMinted[typeId];
    }

    // 출금
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // 유효성 검사
    function _isValidTypeId(uint256 typeId) internal view returns (bool) {
        return typeId > 0 && typeId < nextTypeId;
    }

    // URI
    function uri(uint256 typeId) public view override returns (string memory) {
        return super.uri(typeId);
    }

    function burn(address account, uint256 id, uint256 amount) external {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "Not owner nor approved"
        );
        _burn(account, id, amount);
        totalMinted[id] -= amount;
    }
}