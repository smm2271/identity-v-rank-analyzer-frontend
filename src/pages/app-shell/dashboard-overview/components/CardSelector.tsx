import { type CardKey, CARD_DEFINITIONS } from "../types";

interface CardSelectorProps {
    show: boolean;
    onClose: () => void;
    visibleCards: Set<CardKey>;
    onToggle: (key: CardKey) => void;
    orderMetric: CardKey[];
    orderPanel: CardKey[];
    getDragProps: (key: CardKey) => any;
    draggedCard: CardKey | null;
    styles: any;
}

export function CardSelector({
    show,
    onClose,
    visibleCards,
    onToggle,
    orderMetric,
    orderPanel,
    getDragProps,
    draggedCard,
    styles,
}: CardSelectorProps) {
    if (!show) return null;

    const renderGrid = (keys: CardKey[]) => (
        <div className={styles.cardSelectorGrid}>
            {keys.map((key) => {
                const def = CARD_DEFINITIONS[key];
                return (
                    <div
                        key={key}
                        {...getDragProps(key)}
                        className={`${styles.cardItem} ${draggedCard === key ? styles.cardItemDragging : ''}`}
                    >
                        <label className={styles.cardCheckbox}>
                            <input
                                type="checkbox"
                                checked={visibleCards.has(key)}
                                onChange={() => onToggle(key)}
                            />
                            <span>{def.label}</span>
                        </label>
                        <span className={styles.dragHandle}>⋮⋮</span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div
            className={styles.cardSelectorOverlay}
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
            role="presentation"
        >
            <section
                className={styles.cardSelectorPanel}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <div className={styles.cardSelectorHeader}>
                    <h3>選擇要顯示的卡片 (可拖拽排序)</h3>
                    <button
                        type="button"
                        className={styles.cardSelectorClose}
                        onClick={onClose}
                        aria-label="關閉卡片選擇視窗"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.cardSelectorContent}>
                    <div className={styles.selectorSection}>
                        <p className={styles.selectorSectionTitle}>數值顯示卡片</p>
                        {renderGrid(orderMetric)}
                    </div>

                    <div className={styles.selectorSection}>
                        <p className={styles.selectorSectionTitle}>數據顯示卡片</p>
                        {renderGrid(orderPanel)}
                    </div>
                </div>
            </section>
        </div>
    );
}
