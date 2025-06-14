import { useEffect, useState } from "react";

export function useWallet() {
	const [walletAddress, setWalletAddress] = useState<string | null>(null);

	const connectWallet = async () => {
		if (!window.ethereum) {
			alert("Metamask를 설치해주세요.");
			return;
		}
		try {
			const accounts: string[] = await window.ethereum.request({
				method: "eth_requestAccounts",
			});
			if (accounts.length > 0) {
				setWalletAddress(accounts[0]);
			}
		} catch (error) {
			console.error("지갑 연결 실패:", error);
		}
	};

	useEffect(() => {
		if (window.ethereum) {
			window.ethereum
				.request({ method: "eth_accounts" })
				.then((accounts: string[]) => {
					if (accounts.length > 0) {
						setWalletAddress(accounts[0]);
					} else {
						setWalletAddress(null); // 연결된 계정 없을 때 초기화
					}
				})
				.catch((err: any) => console.error("계정 조회 실패:", err));

			// accountsChanged 이벤트 등록
			const handleAccountsChanged = (accounts: string[]) => {
				if (accounts.length === 0) {
					// 지갑 연결 해제
					setWalletAddress(null);
				} else {
					setWalletAddress(accounts[0]);
				}
			};

			window.ethereum.on("accountsChanged", handleAccountsChanged);

			return () => {
				window.ethereum.removeListener(
					"accountsChanged",
					handleAccountsChanged
				);
			};
		}
	}, []);

	return {
		walletAddress,
		connectWallet,
	};
}
