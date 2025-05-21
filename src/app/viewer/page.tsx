"use client";

import CardItem from "../components/CardItem";
import styles from "./ViewerPage.module.css";
import Link from "next/link";
import { useState } from "react";

const mockCards = [
	{
		name: "피카츄",
		image:
			"https://mblogthumb-phinf.pstatic.net/20160817_259/retspe_14714118890125sC2j_PNG/%C7%C7%25C4%25AB%25C3%25F2_%25281%2529.png?type=w800",
		rarity: "Legendary",
	},
	{
		name: "파이리",
		image: "https://t1.daumcdn.net/cfile/tistory/02197D3D518DADFC01",
		rarity: "Epic",
	},
];

export default function ViewerPage() {
	const [search, setSearch] = useState("");
	const [rarityFilter, setRarityFilter] = useState("All");
	const [sortBy, setSortBy] = useState<"name" | "rarity">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedCard, setSelectedCard] = useState<
		null | (typeof mockCards)[0]
	>(null);

	const filteredCards = mockCards
		.filter((card) => rarityFilter === "All" || card.rarity === rarityFilter)
		.filter((card) => card.name.includes(search))
		.sort((a, b) => {
			const direction = sortOrder === "asc" ? 1 : -1;
			if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
			return a.rarity.localeCompare(b.rarity) * direction;
		});

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>내 카드 목록</h2>

			<div className={styles.filters}>
				<input
					type="text"
					placeholder="카드 이름 검색"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					value={rarityFilter}
					onChange={(e) => setRarityFilter(e.target.value)}
				>
					<option value="All">전체</option>
					<option value="Legendary">Legendary</option>
					<option value="Epic">Epic</option>
				</select>
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value as "name" | "rarity")}
				>
					<option value="name">이름순</option>
					<option value="rarity">희귀도순</option>
				</select>
				<select
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
				>
					<option value="asc">오름차순</option>
					<option value="desc">내림차순</option>
				</select>
			</div>

			<div className={styles.cardList}>
				{filteredCards.map((card) => (
					<div key={card.name} onClick={() => setSelectedCard(card)}>
						<CardItem {...card} />
					</div>
				))}
			</div>

			{selectedCard && (
				<div className={styles.modal} onClick={() => setSelectedCard(null)}>
					<div
						className={styles.modalContent}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>{selectedCard.name}</h3>
						<img src={selectedCard.image} alt={selectedCard.name} />
						<p>희귀도: {selectedCard.rarity}</p>
						<button onClick={() => setSelectedCard(null)}>닫기</button>
					</div>
				</div>
			)}

			<div className={styles.buttonWrapper}>
				<Link href="/">
					<button className={styles.navigateButton}>메인으로 돌아가기</button>
				</Link>
			</div>
		</div>
	);
}
