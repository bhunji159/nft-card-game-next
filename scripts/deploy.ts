import { ethers } from "hardhat";

async function main() {
	// 1) UniqueCardNFT 배포
	const UniqueCardNFT = await ethers.getContractFactory("UniqueCardNFT");
	const uniqueNFT = await UniqueCardNFT.deploy();
	await uniqueNFT.deployed();
	console.log("UniqueCardNFT deployed to:", uniqueNFT.address);

	// 2) MultiCardItems 배포
	const MultiCardItems = await ethers.getContractFactory("MultiCardItems");
	const multiNFT = await MultiCardItems.deploy();
	await multiNFT.deployed();
	console.log("MultiCardItems deployed to:", multiNFT.address);

	// 3) GameManager 배포
	const GameManager = await ethers.getContractFactory("GameManager");

	// 카드팩 가격을 1 이더(wei 단위)로 설정
	const cardPackPrice = ethers.utils.parseEther("1");

	const gameManager = await GameManager.deploy(
		uniqueNFT.address,
		multiNFT.address,
		cardPackPrice
	);
	await gameManager.deployed();
	console.log("GameManager deployed to:", gameManager.address);

	const tx1 = await multiNFT.transferOwnership(gameManager.address);
	await tx1.wait();
	console.log("MultiCardItems ownership transferred to GameManager");

	const tx2 = await uniqueNFT.transferOwnership(gameManager.address);
	await tx2.wait();
	console.log("UniqueCardNFT ownership transferred to GameManager");

	let tx3 = await uniqueNFT.setGameManager(gameManager.address);
    await tx3.wait();
    console.log("Set GameManager in UniqueCardNFT");

    let tx4 = await multiNFT.setGameManager(gameManager.address);
    await tx4.wait();
    console.log("Set GameManager in MultiCardItems");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
