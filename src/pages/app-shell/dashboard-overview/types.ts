export type CardKey = 
    | 'totalMatches' 
    | 'hunterAvgKill' 
    | 'survivorEscapeRate' 
    | 'modeDistribution' 
    | 'mapDistribution' 
    | 'hunterTopRoles' 
    | 'survivorTopRoles' 
    | 'hunterResults' 
    | 'survivorResults';

export interface CardDefinition {
    label: string;
    category: 'metric' | 'panel';
}

export const CARD_DEFINITIONS: Record<CardKey, CardDefinition> = {
    totalMatches: { label: '總場次', category: 'metric' },
    hunterAvgKill: { label: '監管平均淘汰數', category: 'metric' },
    survivorEscapeRate: { label: '求生逃脫率', category: 'metric' },
    modeDistribution: { label: '對戰模式分布', category: 'panel' },
    mapDistribution: { label: '地圖出現比例', category: 'panel' },
    hunterTopRoles: { label: '常用監管角色', category: 'panel' },
    survivorTopRoles: { label: '常用求生角色', category: 'panel' },
    hunterResults: { label: '監管對局結果', category: 'panel' },
    survivorResults: { label: '求生對局結果', category: 'panel' },
};

export type PieData = { 
    label: string; 
    value: number; 
    color: string; 
    sublabel?: string 
};

export interface DashboardStats {
    totalMatches: number;
    loadedMatchCount: number;
    matchCounts: Record<string, number>;
    topMatchType: { label: string; value: number } | null;
    mapCounts: PieData[];
    topHunters: Array<{ pid: number; count: number }>;
    topSurvivors: Array<{ pid: number; count: number }>;
    hunterResults: { win: number; tie: number; loss: number; total: number };
    survivorResults: { win: number; tie: number; loss: number; total: number };
    hunterAverageKills: number | null;
    survivorEscapeRate: number | null;
}
