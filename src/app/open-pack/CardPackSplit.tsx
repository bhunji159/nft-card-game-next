"use client";

import { useState } from "react";
import styles from "./CardPackSplit.module.css";

export default function CardPackSplit() {
	const [isOpened, setIsOpened] = useState(false);

	const handleClick = () => {
		if (!isOpened) setIsOpened(true);
	};

	return (
		<div className={styles.container} onClick={handleClick}>
			<img
				src="/card-pack-top.png"
				alt="Card Pack Top"
				className={`${styles.top} ${isOpened ? styles.opened : ""}`}
				draggable={false}
			/>
			<img
				src="/card-pack-body.png"
				alt="Card Pack Body"
				className={styles.body}
				draggable={false}
			/>
		</div>
	);
}
