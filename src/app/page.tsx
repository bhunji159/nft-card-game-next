"use client";

import Link from "next/link";
import { useWallet } from "../lib/useWallet";
import styles from "./Home.module.css"; // ✅ 수정됨

export default function Home() {
	const { walletAddress, connectWallet } = useWallet();

	if (!walletAddress) {
		return (
			<div className={styles["home-container"]}>
				<h2 className={styles["home-title"]}>지갑 연결 필요</h2>
				<p className={styles["home-description"]}>
					NFT 마켓을 이용하려면 지갑을 연결해주세요.
				</p>
				<button className={styles["navigate-button"]} onClick={connectWallet}>
					지갑 연결
				</button>
			</div>
		);
	}

	return (
		<div className={styles["home-container"]}>
			<h1 className={styles["home-title"]}>NFT 카드 게임</h1>
			<p className={styles["home-description"]}>
				카드 보기, 마켓, 카드깡 기능을 시작하세요.
			</p>
			<div className={styles["button-wrapper"]}>
				<Link href="/viewer">
					<button className={styles["navigate-button"]}>
						카드 뷰어로 이동
					</button>
				</Link>
			</div>
			<div className={styles["button-wrapper"]}>
				<Link href="/market">
					<button className={styles["navigate-button"]}>
						마켓 페이지로 이동
					</button>
				</Link>
			</div>

			<div className={styles["button-wrapper"]}>
				<Link href="/open-pack">
					<button className={styles["navigate-button"]}>카드 개봉하기</button>
				</Link>
			</div>
		</div>
	);
}
