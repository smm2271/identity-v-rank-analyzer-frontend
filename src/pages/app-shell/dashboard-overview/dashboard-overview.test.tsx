import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardOverviewPage from './dashboard-overview';
import * as useDashboardDataHook from './hooks/useDashboardData';

// Mock child components to isolate DashboardOverviewPage tests
vi.mock('./components/PieChart', () => ({
    PieChart: ({ centerTitle, centerSub }: any) => (
        <div data-testid="pie-chart">
            <span>{centerTitle}</span>
            <span>{centerSub}</span>
        </div>
    )
}));

vi.mock('./components/CardSelector', () => ({
    CardSelector: () => <div data-testid="card-selector">CardSelector</div>
}));

const mockVisibleCards = new Set([
    'totalMatches', 'hunterAvgKill', 'survivorEscapeRate', 
    'modeDistribution', 'mapDistribution', 'hunterTopRoles', 
    'survivorTopRoles', 'hunterResults', 'survivorResults'
]);

vi.mock('./hooks/useDashboardLayout', () => ({
    useDashboardLayout: () => ({
        visibleCards: mockVisibleCards,
        cardOrder: [...mockVisibleCards],
        orderedMetricCards: ['totalMatches', 'hunterAvgKill', 'survivorEscapeRate'],
        orderedPanelCards: ['modeDistribution', 'mapDistribution', 'hunterTopRoles', 'survivorTopRoles', 'hunterResults', 'survivorResults'],
        draggedCard: null,
        handleCardToggle: vi.fn(),
        getDragProps: () => ({})
    })
}));

describe('DashboardOverviewPage Boundary Conditions', () => {
    it('renders loading state when data is fetching and no matches exist', () => {
        vi.spyOn(useDashboardDataHook, 'useDashboardData').mockReturnValue({
            stats: {
                totalMatches: 0,
                hunterAverageKills: null,
                survivorEscapeRate: null,
                loadedMatchCount: 0,
                matchCounts: {},
                mapCounts: [],
                topHunters: [],
                topSurvivors: [],
                hunterResults: { win: 0, tie: 0, loss: 0, total: 0 },
                survivorResults: { win: 0, tie: 0, loss: 0, total: 0 },
            } as any,
            pageLoading: true,
            matchError: null,
            hasMatches: false
        });

        render(<DashboardOverviewPage />);

        // '總場次' metric should show "載入中..."
        expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('renders error notice when matchError is present', () => {
        vi.spyOn(useDashboardDataHook, 'useDashboardData').mockReturnValue({
            stats: {
                totalMatches: 0,
                hunterAverageKills: null,
                survivorEscapeRate: null,
                loadedMatchCount: 0,
                matchCounts: {},
                mapCounts: [],
                topHunters: [],
                topSurvivors: [],
                hunterResults: { win: 0, tie: 0, loss: 0, total: 0 },
                survivorResults: { win: 0, tie: 0, loss: 0, total: 0 },
            } as any,
            pageLoading: false,
            matchError: '無法載入對戰紀錄，請檢查網路連線',
            hasMatches: false
        });

        render(<DashboardOverviewPage />);

        expect(screen.getByText('無法載入對戰紀錄，請檢查網路連線')).toBeInTheDocument();
    });

    it('renders empty states when no data is available', () => {
        vi.spyOn(useDashboardDataHook, 'useDashboardData').mockReturnValue({
            stats: {
                totalMatches: 0,
                hunterAverageKills: null,
                survivorEscapeRate: null,
                loadedMatchCount: 0,
                matchCounts: {},
                mapCounts: [],
                topHunters: [],
                topSurvivors: [],
                hunterResults: { win: 0, tie: 0, loss: 0, total: 0 },
                survivorResults: { win: 0, tie: 0, loss: 0, total: 0 },
            } as any,
            pageLoading: false,
            matchError: null,
            hasMatches: false
        });

        render(<DashboardOverviewPage />);

        // Total matches = 0
        expect(screen.getByText('0')).toBeInTheDocument(); // total matches value
        
        // Null metrics should show "--"
        const dashes = screen.getAllByText('--');
        expect(dashes.length).toBe(2); // hunterAvgKill, survivorEscapeRate

        // Empty states for panels
        expect(screen.getByText('目前沒有可視化資料，請先載入對戰紀錄。')).toBeInTheDocument();
        expect(screen.getByText('無地圖資料')).toBeInTheDocument();
        expect(screen.getByText('無監管紀錄')).toBeInTheDocument();
        expect(screen.getByText('無求生紀錄')).toBeInTheDocument();
        expect(screen.getByText('無監管排位/匹配紀錄')).toBeInTheDocument();
        expect(screen.getByText('無求生排位/匹配紀錄')).toBeInTheDocument();
    });

    it('renders correct data when stats are fully populated', () => {
        vi.spyOn(useDashboardDataHook, 'useDashboardData').mockReturnValue({
            stats: {
                totalMatches: 100,
                hunterAverageKills: 2.5,
                survivorEscapeRate: 45.2,
                loadedMatchCount: 50,
                matchCounts: { '排位': 30, '匹配': 20 },
                topMatchType: { label: '排位', value: 30 },
                mapCounts: [{ id: 1, name: '軍工廠', value: 15 }],
                topHunters: [{ pid: 1001, count: 10 }],
                topSurvivors: [{ pid: 2001, count: 25 }],
                hunterResults: { win: 10, tie: 5, loss: 5, total: 20 },
                survivorResults: { win: 15, tie: 5, loss: 10, total: 30 },
            } as any,
            pageLoading: false,
            matchError: null,
            hasMatches: true
        });

        render(<DashboardOverviewPage />);

        // Metrics
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('2.5')).toBeInTheDocument();
        expect(screen.getByText('45.2%')).toBeInTheDocument();

        // Mode Distribution
        expect(screen.getByText('排位')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument(); // '排位' count
        expect(screen.getByText('排位 · 30 場')).toBeInTheDocument(); // summary

        // Map Distribution uses PieChart (mocked)
        expect(screen.getAllByTestId('pie-chart').length).toBe(3); // Map, Hunter Results, Survivor Results
    });
});
