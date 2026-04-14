import { useState, useEffect, useMemo } from "react";
import { type CardKey, CARD_DEFINITIONS } from "../types";

export function useDashboardLayout() {
    const [visibleCards, setVisibleCards] = useState<Set<CardKey>>(
        new Set(Object.keys(CARD_DEFINITIONS) as CardKey[])
    );
    const [cardOrder, setCardOrder] = useState<CardKey[]>(
        Object.keys(CARD_DEFINITIONS) as CardKey[]
    );
    const [draggedCard, setDraggedCard] = useState<CardKey | null>(null);
    const [previewOrder, setPreviewOrder] = useState<CardKey[] | null>(null);
    const [isMobile, setIsMobile] = useState(() => 
        typeof window !== 'undefined' ? window.innerWidth <= 720 : false
    );

    // Responsive detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 720);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load from localStorage
    useEffect(() => {
        const savedVisible = localStorage.getItem('dashboardVisibleCards');
        if (savedVisible) {
            try {
                setVisibleCards(new Set(JSON.parse(savedVisible)));
            } catch (e) {}
        }
        const savedOrder = localStorage.getItem('dashboardCardOrder');
        if (savedOrder) {
            try {
                setCardOrder(JSON.parse(savedOrder));
            } catch (e) {}
        }
    }, []);

    const handleCardToggle = (cardKey: CardKey) => {
        setVisibleCards((prev) => {
            const next = new Set(prev);
            if (next.has(cardKey)) next.delete(cardKey);
            else next.add(cardKey);
            localStorage.setItem('dashboardVisibleCards', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const moveCard = (order: CardKey[], dragKey: CardKey, targetKey: CardKey): CardKey[] => {
        if (dragKey === targetKey) return order;
        const draggedIndex = order.indexOf(dragKey);
        const targetIndex = order.indexOf(targetKey);
        if (draggedIndex < 0 || targetIndex < 0) return order;

        const nextOrder = [...order];
        nextOrder.splice(draggedIndex, 1);
        nextOrder.splice(targetIndex, 0, dragKey);
        return nextOrder;
    };

    const handleCardDragStart = (cardKey: CardKey) => {
        setDraggedCard(cardKey);
        setPreviewOrder(cardOrder);
    };

    const handleCardDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCardDragEnter = (targetCard: CardKey) => {
        if (!draggedCard || draggedCard === targetCard) return;
        setPreviewOrder((prev) => moveCard(prev ?? cardOrder, draggedCard, targetCard));
    };

    const handleCardDragEnd = () => {
        setDraggedCard(null);
        setPreviewOrder(null);
    };

    const handleCardDrop = (targetCard: CardKey) => {
        if (!draggedCard) return;
        const newOrder = previewOrder ?? moveCard(cardOrder, draggedCard, targetCard);
        setCardOrder(newOrder);
        localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder));
        handleCardDragEnd();
    };

    const effectiveOrder = previewOrder ?? cardOrder;

    const orderedMetricCards = useMemo(() => {
        return effectiveOrder.filter((key) => CARD_DEFINITIONS[key].category === 'metric');
    }, [effectiveOrder]);

    const orderedPanelCards = useMemo(() => {
        return effectiveOrder.filter((key) => CARD_DEFINITIONS[key].category === 'panel');
    }, [effectiveOrder]);

    /** 
     * [Refactor Fix] 解決元件中重複定義 5 個相同拖拽屬性的問題。
     */
    const getDragProps = (key: CardKey) => {
        return {
            draggable: !isMobile,
            onDragStart: () => handleCardDragStart(key),
            onDragOver: handleCardDragOver,
            onDragEnter: () => handleCardDragEnter(key),
            onDrop: () => handleCardDrop(key),
            onDragEnd: handleCardDragEnd,
        };
    };

    return {
        visibleCards,
        cardOrder: effectiveOrder,
        orderedMetricCards,
        orderedPanelCards,
        draggedCard,
        isMobile,
        handleCardToggle,
        getDragProps
    };
}
