import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts", // .sol 파일 위치
    artifacts: "./artifacts", // ABI 결과 저장 위치
  },
};

export default config;