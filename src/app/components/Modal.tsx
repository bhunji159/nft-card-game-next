"use client";

import styles from "./Modal.module.css";

interface ModalProps {
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function Modal({ message, onCancel, onConfirm }: ModalProps) {
	return (
		<div className={styles.overlay}>
			<div className={styles.modal}>
				<p>{message}</p>
				<div className={styles.buttons}>
					<button className={styles.cancelButton} onClick={onCancel}>
						취소
					</button>
					<button className={styles.confirmButton} onClick={onConfirm}>
						구매
					</button>
				</div>
			</div>
		</div>
	);
}
