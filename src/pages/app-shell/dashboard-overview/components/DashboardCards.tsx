import type { ReactNode } from "react";
import type { CardKey } from "../types";

interface MetricCardProps {
    id: CardKey;
    label: string;
    value: string | number | ReactNode;
    getDragProps: (key: CardKey) => any;
    draggedCard: CardKey | null;
    order: number;
    styles: any;
    className?: string;
}

export function MetricCard({
    id,
    label,
    value,
    getDragProps,
    draggedCard,
    order,
    styles,
    className = "",
}: MetricCardProps) {
    return (
        <article
            {...getDragProps(id)}
            style={{ order }}
            className={`${styles.metricCard} ${styles.draggableCard} ${draggedCard === id ? styles.draggableCardDragging : ''} ${className}`}
        >
            <p className={styles.label}>{label}</p>
            <p className={styles.value}>{value}</p>
        </article>
    );
}

interface PanelCardProps {
    id: CardKey;
    kicker?: string;
    title: string;
    meta?: string;
    children: ReactNode;
    getDragProps: (key: CardKey) => any;
    draggedCard: CardKey | null;
    order: number;
    styles: any;
    className?: string;
}

export function PanelCard({
    id,
    kicker,
    title,
    meta,
    children,
    getDragProps,
    draggedCard,
    order,
    styles,
    className = "",
}: PanelCardProps) {
    return (
        <article
            {...getDragProps(id)}
            style={{ order }}
            className={`${styles.panel} ${styles.draggableCard} ${draggedCard === id ? styles.draggableCardDragging : ''} ${className}`}
        >
            <div className={styles.panelHeader}>
                <div>
                    {kicker && <p className={styles.panelKicker}>{kicker}</p>}
                    <h3>{title}</h3>
                </div>
                {meta && <p className={styles.panelMeta}>{meta}</p>}
            </div>
            {children}
        </article>
    );
}
