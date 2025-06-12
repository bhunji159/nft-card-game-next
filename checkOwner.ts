import { ethers } from "ethers";
import GameManagerABI from "./src/abis/GameManager.json" assert { type: "json" };

const GAME_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
	const provider = new ethers.providers.JsonRpcProvider(
		"http://localhost:8545"
	);
	const contract = new ethers.Contract(
		GAME_MANAGER_ADDRESS,
		GameManagerABI,
		provider
	);
	const owner = await contract.owner();
	console.log("Owner:", owner);
}

main().catch(console.error);
