import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
	solidity: "0.8.20",
	paths: {
		sources: "./contracts",
		artifacts: "./artifacts",
	},
};

export default config;
