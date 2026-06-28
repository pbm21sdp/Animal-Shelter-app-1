/**
 * Formats an ISO date string for recharts XAxis ticks.
 * Shows "Mon YYYY" on the first tick and whenever the year changes;
 * otherwise shows "M/D" (daily/weekly) or just "Mon" (monthly).
 *
 * @param {Array<{date: string}>} chartData - Full chart data array (dataKey="date")
 * @param {'daily'|'weekly'|'monthly'} viewMode
 * @returns {(value: string, index: number) => string}
 */
export function makeRechartsXAxisFormatter(chartData, viewMode) {
    return (value, index) => {
        const d = new Date(value);
        const year = d.getFullYear();
        const month = d.toLocaleDateString('en-US', { month: 'short' });

        const prevYear = index > 0
            ? new Date(chartData[index - 1]?.date).getFullYear()
            : null;
        const showYear = index === 0 || year !== prevYear;

        if (viewMode === 'monthly') {
            return showYear ? `${month} ${year}` : month;
        }
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
        return showYear ? `${month} ${year}` : dayStr;
    };
}

/**
 * Chart.js ticks.callback for pre-formatted "MMM YY" label arrays.
 * Shows "Mon YYYY" on the first tick and whenever the year changes;
 * otherwise shows just "Mon".
 *
 * @param {string[]} allLabels - e.g. ["Apr 26", "May 26", ...]
 * @returns {(value: *, index: number) => string}
 */
export function makeChartJsLabelFormatter(allLabels) {
    return (_value, index) => {
        const label = allLabels[index];
        if (!label) return '';
        const [month, yearShort] = label.split(' ');
        const prevLabel = allLabels[index - 1];
        const prevYearShort = prevLabel?.split(' ')[1];
        const showYear = index === 0 || yearShort !== prevYearShort;
        return showYear ? `${month} 20${yearShort}` : month;
    };
}
