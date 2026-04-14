import type { PieData } from "../types";

interface PieChartProps {
    data: PieData[];
    centerTitle: string;
    centerSub: string;
    styles: any; // Keep styles passed from parent for now
}

export function PieChart({ data, centerTitle, centerSub, styles }: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return <div className={styles.stateBox}>無資料</div>;
    }

    let cumulative = 0;
    const gradients = data.map((item) => {
        const percent = (item.value / total) * 100;
        const start = cumulative;
        const end = cumulative + percent;
        cumulative = end;
        return `${item.color} ${start}% ${end}%`;
    }).join(", ");

    return (
        <div className={styles.pieContainer}>
            <div className={styles.pieVisual}>
                <div className={styles.pieChart} style={{ background: `conic-gradient(${gradients})` }} />
                <div className={styles.pieCenterText}>
                    <strong>{centerTitle}</strong>
                    <span>{centerSub}</span>
                </div>
            </div>
            <div className={styles.pieLegend}>
                {data.map((item) => (
                    <div key={item.label} className={styles.pieLegendItem}>
                        <div className={styles.pieLegendColor} style={{ backgroundColor: item.color }} />
                        <div className={styles.pieLegendText}>
                            <span>{item.label}</span>
                            <small>{item.value} 場 ({((item.value / total) * 100).toFixed(1)}%) {item.sublabel ?? ""}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
