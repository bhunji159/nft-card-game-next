"use client";

import { useWallet } from "../../lib/useWallet";
import styles from "./WalletConnect.module.css"; // ✅ CSS 모듈은 import from + 객체 사용

const WalletConnect: React.FC = () => {
	const { walletAddress, connectWallet } = useWallet();

	return (
		<div className={styles["wallet-box"]}>
			{walletAddress ? (
				<p>
					지갑 연결됨: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
				</p>
			) : (
				<button className={styles["wallet-button"]} onClick={connectWallet}>
					지갑 연결
				</button>
			)}
		</div>
	);
};

export default WalletConnect;
