import { ethers } from "hardhat";
import { Event } from "ethers";

async function main() {
	const gameManagerAddress = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"; // <- 배포된 GameManager 주소 입력
	const gameManager = await ethers.getContractAt("GameManager", gameManagerAddress);

	const [deployer] = await ethers.getSigners();

	console.log("Using deployer:", deployer.address);

	// 1. Unique 카드 등록 (고유 ID와 URI 지정)
	const uniqueCards = [
		{ tokenId: 1, uri: "ipfs://QmRvzEqNPuhD9o44ti36kieJ7hvzpWKhtWgu9GQiffNDut" },
		{ tokenId: 2, uri: "ipfs://QmYkjdnNgD98ihP1J34HCuWs1DfQhiABdcCgXp8M9cv9fx" },
	];

	for (const card of uniqueCards) {
		const tx = await gameManager.connect(deployer).addUniqueCard(card.tokenId, card.uri);
		await tx.wait();
		console.log(`Unique Card Registered: tokenId ${card.tokenId}, URI: ${card.uri}`);
	}

	// 2. Multi 카드 등록 (타입 자동 생성, URI 지정)
	const multiCardURIs = [
		"ipfs://QmVHYaJDxrcTcFkzUCUCqvoHp5HF3Fc8MBuC9EpBKbmSwK",      // typeId = 3
		"ipfs://QmbPXNjBtVkiMoHf1a6K7uXcEN9ZUQTYcm2DCrpykpo1XF",
		"ipfs://QmTdpGzCgXyCsbnwZmWk9F5S5EDSuht5ChnQ3EWJLNKgAi",
		"ipfs://QmYk5J8th7cUF9U4KFC7MxcpNvpVJDzQR3i6YyyELvnQeE",
		"ipfs://QmXK3YSoDjNiZD1PiJVzWVoZyv6t74sLALqVNewY4RFYQQ",
		"ipfs://QmT2i1bk3QJsA7LQgXXZvMZLrvoMW2YWRhSdgEmPZRe5D1",
		"ipfs://QmccyEP3iGysZhhs4pwccjPdbzPqrYNhLN1BUGte8dN7JH",
		"ipfs://QmebToXA1d8tgzPiFj32MUMk3bru2f8oETh49a13VTbRXd",    // typeId = 10
	];

	for (const uri of multiCardURIs) {
		const tx = await gameManager.connect(deployer).addMultiCardType(uri);
		const receipt = await tx.wait();
		const event = receipt.events?.find((e: Event) => e.event === undefined); // fallback
		console.log(`MultiCard Type Registered: URI = ${uri}`);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});