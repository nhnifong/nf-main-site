import Chart from 'chart.js/auto';

// The scoreboard fetches the entire measurement history (plus metric
// metadata) in one call. From it we fill each card's latest value and draw
// one combined trend chart. Entered at /employee/metrics.

// Describes a metric: its stable key, human-readable title, and unit label.
interface MetricMeta {
    key: string;
    title: string;
    unit: string;
}

// A single dated reading of one metric (value is null when not recorded).
interface Measurement {
    metric_key: string;
    measured_on: string;
    value: number | null;
}

// Payload from /api/metrics: metric definitions plus the full reading history.
interface MetricsResponse {
    metrics?: MetricMeta[];
    measurements?: Measurement[];
}

// Payload from /api/fleet/active_count: the deployed-robot headline number.
interface FleetCountResponse {
    active_count: number;
}

// Each plotted point carries its metric's unit so the tooltip can render it.
interface TrendPoint {
    x: string;
    y: number;
    unit: string;
}

// Format a measured number for display, capping trailing decimals.
const fmt = (v: number): string =>
    Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });

// Distinct, readable line colors (one per metric, assigned by order).
const PALETTE = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#469990', '#9A6324'];

// Fetch the deployed fleet size (distinct robots seen online in the last 3
// months) and drop it into the hero number.
(async function loadFleetCount() {
    try {
        const res = await fetch('/api/fleet/active_count');
        if (!res.ok) return;
        const { active_count } = (await res.json()) as FleetCountResponse;
        const el = document.getElementById('deployed-count');
        if (el) el.textContent = String(active_count);
    } catch (e) {
        console.error('Failed to load fleet count', e);
    }
})();

// Fetch the metric history, populate each card's latest value, and render the
// combined trend chart.
(async function loadMetrics() {
    let data: MetricsResponse;
    try {
        const res = await fetch('/api/metrics');
        if (!res.ok) return;
        data = (await res.json()) as MetricsResponse;
    } catch (e) {
        console.error('Failed to load metrics', e);
        return;
    }

    const meta = data.metrics || [];
    const measurements = data.measurements || [];

    // Group into per-metric series and collect the shared date axis.
    const series: Record<string, Measurement[]> = {};
    const dateSet = new Set<string>();
    for (const m of measurements) {
        if (m.value === null || m.value === undefined) continue;
        (series[m.metric_key] ||= []).push(m);
        dateSet.add(m.measured_on);
    }
    const labels = [...dateSet].sort();

    // Fill each card's latest value.
    let newest: string | null = null;
    document.querySelectorAll<HTMLElement>('[data-metric]').forEach((el) => {
        const key = el.dataset.metric;
        const points = key ? series[key] : undefined;
        if (!points || points.length === 0) return;
        const last = points[points.length - 1];
        if (last.value === null) return;
        el.textContent = fmt(last.value);
        el.classList.remove('pending');
        if (!newest || last.measured_on > newest) newest = last.measured_on;
    });
    if (newest) {
        const asOf = document.getElementById('as-of');
        if (asOf) asOf.textContent = `As of ${newest}`;
    }

    const host = document.getElementById('trend-chart');
    if (!(host instanceof HTMLCanvasElement)) return;
    if (labels.length === 0) {
        return;
    }

    // One dataset per metric, aligned to the shared date labels (null = no
    // measurement that day). Points plot the raw measured value directly.
    // `metricTitle` is a custom field read back in the tooltip callback.
    const datasets = meta.map((mt, idx) => {
        const byDate = new Map((series[mt.key] || []).map((p) => [p.measured_on, p.value]));
        const color = PALETTE[idx % PALETTE.length];
        return {
            label: mt.unit,
            metricTitle: mt.title,
            borderColor: color,
            backgroundColor: color,
            spanGaps: true,
            tension: 0.2,
            data: labels.map((d): TrendPoint | null => {
                const value = byDate.get(d);
                if (value === undefined || value === null) return null;
                return { x: d, y: value, unit: mt.unit };
            }),
        };
    });

    new Chart(host, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                y: { title: { display: true, text: 'measured value' } },
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        // Show the metric's title with the measured value and unit.
                        label: (ctx) => {
                            const raw = ctx.raw as TrendPoint | null;
                            const unit = raw?.unit ?? '';
                            const metricTitle = (ctx.dataset as { metricTitle?: string }).metricTitle ?? '';
                            const y = ctx.parsed.y ?? 0;
                            return `${metricTitle}: ${fmt(y)} ${unit}`;
                        },
                    },
                },
            },
        },
    });
})();
