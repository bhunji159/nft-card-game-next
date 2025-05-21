"use client";

import { useState } from "react";
import { useWallet } from "../../lib/useWallet";
import styles from "./RegisterPage.module.css";

export default function Register() {
	const { walletAddress, connectWallet } = useWallet();
	const [nickname, setNickname] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [registering, setRegistering] = useState(false);

	const handleRegister = async () => {
		if (!walletAddress || !agreed || !nickname.trim()) return;

		setRegistering(true);

		const nonce = "회원가입을 위해 서명해주세요.";

		try {
			const signature = await window.ethereum.request({
				method: "personal_sign",
				params: [nonce, walletAddress],
			});

			const res = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					walletAddress,
					signature,
					agreedAt: new Date().toISOString(),
					nickname: nickname.trim(),
				}),
			});

			if (res.ok) {
				alert("회원가입 완료!");
			} else {
				const data = await res.json();
				alert("실패: " + data.message);
			}
		} catch (err) {
			console.error("서명 실패:", err);
			alert("서명 또는 전송 실패");
		} finally {
			setRegistering(false);
		}
	};

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>회원가입</h2>
			{!walletAddress ? (
				<button className={styles.button} onClick={connectWallet}>
					지갑 연결
				</button>
			) : (
				<>
					<p className={styles.address}>지갑 주소: {walletAddress}</p>

					<input
						type="text"
						placeholder="닉네임을 입력하세요"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						className={styles.input}
					/>

					<label className={styles.checkboxWrapper}>
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
						/>
						[필수] 개인정보 수집 및 이용에 동의합니다.
					</label>

					<button
						className={styles.button}
						onClick={handleRegister}
						disabled={!agreed || !nickname.trim() || registering}
					>
						{registering ? "처리 중..." : "서명하고 회원가입"}
					</button>
				</>
			)}
		</div>
	);
}
