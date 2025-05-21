"use client";

import { useState } from "react";
import "../globals.css";

import styles from "./MarketPage.module.css";

const initialMarketCards = [
	{
		name: "이상해씨",
		image:
			"https://upload.wikimedia.org/wikipedia/ko/3/3b/%ED%8F%AC%EC%BC%93%EB%AA%AC_%EC%9D%B4%EC%83%81%ED%95%B4%EC%94%A8.png",
		rarity: "Legendary",
		price: "1.5 ETH",
	},
	{
		name: "꼬부기",
		image:
			"https://i.namu.wiki/i/oNUoipAJJIO1iTX5j8D3uPnUmJLe3xkpvMmteP7cm_JH9PCjtChpIvZxyALeaflR0HqfOYq8yZ1Jk8mLCA9wheU9o-0EqWrmI9DRO-a14tWVPp8heO5lb_HgMBI0zp6bI_bqmT785shzlscoTjK7ug.webp",
		rarity: "Epic",
		price: "0.8 ETH",
	},
];

const ownedCards = [
	{ name: "피카츄", rarity: "Legendary" },
	{ name: "파이리", rarity: "Epic" },
];

export default function MarketPage() {
	const [marketCards, setMarketCards] = useState(initialMarketCards);
	const [showModal, setShowModal] = useState(false);
	const [sortBy, setSortBy] = useState<"name" | "rarity" | "price">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [search, setSearch] = useState("");
	const [selectedCard, setSelectedCard] = useState<{
		name: string;
		rarity: string;
	} | null>(null);
	const [inputPrice, setInputPrice] = useState("");
	const [balance, setBalance] = useState("3.2");

	return (
		<div className={styles["market-container"]}>
			<h2 className={styles["section-title"]}>마켓플레이스</h2>
			<div className={styles["market-sort-controls"]}>
				<div className={styles["wallet-balance"]}>💰 잔액: {balance} ETH</div>
				<input
					type="text"
					placeholder="카드 이름 검색"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					value={sortBy}
					onChange={(e) =>
						setSortBy(e.target.value as "name" | "rarity" | "price")
					}
				>
					<option value="name">이름순</option>
					<option value="rarity">희귀도순</option>
					<option value="price">가격순</option>
				</select>
				<select
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
				>
					<option value="asc">오름차순</option>
					<option value="desc">내림차순</option>
				</select>
			</div>

			<div className={styles["card-list"]}>
				{marketCards
					.filter((card) =>
						card.name.toLowerCase().includes(search.toLowerCase())
					)
					.sort((a, b) => {
						const direction = sortOrder === "asc" ? 1 : -1;
						if (sortBy === "name")
							return a.name.localeCompare(b.name) * direction;
						if (sortBy === "rarity")
							return a.rarity.localeCompare(b.rarity) * direction;
						const priceA = parseFloat(a.price);
						const priceB = parseFloat(b.price);
						return (priceA - priceB) * direction;
					})
					.map((card, index) => (
						<div
							key={`${card.name}-${index}`}
							className={styles["market-card-wrapper"]}
						>
							<div className={styles["card-image-wrapper"]}>
								<img
									src={card.image}
									alt={card.name}
									className={styles["card-image"]}
								/>
							</div>
							<h3 className={styles["card-title"]}>{card.name}</h3>
							<p className={styles["card-rarity"]}>{card.rarity}</p>
							<p className={styles["card-price"]}>가격: {card.price}</p>
							<button className={styles["buy-button"]}>구매</button>
						</div>
					))}
			</div>

			<button
				className={styles["register-button"]}
				onClick={() => setShowModal(true)}
			>
				카드 등록
			</button>

			{showModal && (
				<div className={styles["modal"]} onClick={() => setShowModal(false)}>
					<div
						className={styles["modal-content"]}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>보유한 카드 목록</h3>
						<div className={styles["owned-card-list"]}>
							{ownedCards.map((card) => (
								<div
									key={card.name}
									className={styles["owned-card-item"]}
									onClick={() => setSelectedCard(card)}
								>
									<strong>{card.name}</strong>
									<span className={styles["rarity-badge"]}>{card.rarity}</span>
								</div>
							))}
						</div>
						<button onClick={() => setShowModal(false)}>닫기</button>
						{selectedCard && (
							<div className={styles["register-modal"]}>
								<h3>{selectedCard.name} 등록</h3>
								<input
									type="number"
									placeholder="가격 (ETH)"
									value={inputPrice}
									onChange={(e) => setInputPrice(e.target.value)}
								/>
								<button
									onClick={() => {
										if (!inputPrice) return;
										const image = "/default-card.png";
										setMarketCards((prev) => [
											...prev,
											{ ...selectedCard, price: `${inputPrice} ETH`, image },
										]);
										setSelectedCard(null);
										setInputPrice("");
										setShowModal(false);
									}}
								>
									등록하기
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
