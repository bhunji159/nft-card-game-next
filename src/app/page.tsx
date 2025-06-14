"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "../lib/useWallet";
import styles from "./Home.module.css";
import OpenPackPage from "./open-pack/page";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
	const { walletAddress, connectWallet } = useWallet();
	const [showOpenPack, setShowOpenPack] = useState(false);

	// 지갑 연결 시 유저 정보 저장
	useEffect(() => {
		if (!walletAddress) return;

		async function saveUser() {
			try {
				const userRef = doc(db, "users", walletAddress!);
				await setDoc(
					userRef,
					{
						walletAddress,
						lastLogin: new Date(),
					},
					{ merge: true }
				);
				console.log("Firebase에 유저 정보 저장 완료");
			} catch (error) {
				console.error("Firebase 저장 실패", error);
			}
		}

		saveUser();
	}, [walletAddress]);

	// 지갑 연결 안 되어 있으면 연결 버튼 보여주기
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

	// 카드 개봉 페이지 보여주기
	if (showOpenPack) {
		return <OpenPackPage onBack={() => setShowOpenPack(false)} />;
	}

	// 지갑 연결 완료 시 기본 홈 화면
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
				<button
					className={styles["navigate-button"]}
					onClick={() => setShowOpenPack(true)}
				>
					카드 개봉하기
				</button>
			</div>
		</div>
	);
}
