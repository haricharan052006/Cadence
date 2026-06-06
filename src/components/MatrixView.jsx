import React, { useRef, useEffect } from 'react';
import { useApp, getLocalDateString } from '../context/AppContext';

export default function MatrixView() {
    const { habits, history } = useApp();
    const matrixContainerRef = useRef(null);

    // Generate Past 30 Days array with TODAY at the rightmost edge
    const past30DaysArray = Array.from({ length: 30 }, (_, index) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - index));
        return d;
    });

    // Automatically scroll the matrix viewport rightward to display Today immediately
    useEffect(() => {
        if (matrixContainerRef.current) {
            matrixContainerRef.current.scrollLeft = matrixContainerRef.current.scrollWidth;
        }
    }, [habits]);

    // Check if a habit is scheduled to run on a specific day of the week
    const isHabitScheduledForDay = (habit, dateObj) => {
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        if (habit.frequency === 'daily') return true;
        if (habit.frequency === 'weekdays') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayOfWeek);
        if (habit.frequency === 'weekends') return ['Sat', 'Sun'].includes(dayOfWeek);
        if (habit.frequency === 'custom') return habit.customDays?.includes(dayOfWeek);
        return false;
    };

    // Compute stats for the trend graph
    const graphData = past30DaysArray.map(dateObj => {
        const dateStr = getLocalDateString(dateObj);
        const dayLog = history[dateStr] || {};

        const expectedHabits = habits.filter(h => isHabitScheduledForDay(h, dateObj));
        const expectedCount = expectedHabits.length;

        const mathematicalScore = expectedHabits.reduce((acc, h) => {
            const status = dayLog[h.id];
            if (status === 'Done') return acc + 1.0;
            if (status === 'Partial') return acc + 0.5;
            return acc;
        }, 0);

        const percent = expectedCount > 0 ? Math.round((mathematicalScore / expectedCount) * 100) : 0;

        return {
            dateLabel: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            percentage: percent
        };
    });

    return (
        <div className="space-y-6 animate-fadeIn max-w-full">
            <div className="border-b border-stone-200 dark:border-slate-800 pb-3">
                <h1 className="text-xl font-semibold text-stone-900 dark:text-slate-50">30-Day Performance Matrix</h1>
                <p className="text-xs font-mono text-stone-400 mt-0.5">Read-Only Logs Matrix (Swipe left to view past history)</p>
            </div>

            {/* Legend Deck */}
            <div className="flex flex-wrap gap-4 p-2.5 bg-white dark:bg-slate-850 rounded-lg border border-stone-200 dark:border-slate-800 text-[10px] font-mono shadow-xs">
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-sage-500" /> <span>Fully Done</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-orange-400" /> <span>Partially Done</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-400/20 border border-red-300/30" /> <span>Missed Sweep</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded border border-stone-200 dark:border-slate-700" /> <span>Tracked Day</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded border border-stone-200 dark:border-slate-700 opacity-25" /> <span>Not Applicable</span></div>
            </div>

            {habits.length === 0 ? (
                <p className="text-center py-12 text-xs font-mono text-stone-400">Initialize habits to generate performance grids.</p>
            ) : (
                /* Structural containment layer fixes scrolling bleed-through bugs entirely */
                <div className="bg-white dark:bg-slate-850 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div ref={matrixContainerRef} className="overflow-x-auto scroll-smooth whitespace-nowrap py-4 style-scrollbar">
                        <table className="min-w-full border-collapse isolate">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 bg-white dark:bg-slate-850 text-left pl-4 pr-4 pb-3 text-xs font-mono text-stone-400 uppercase z-30 min-w-[120px] border-b border-stone-100 dark:border-slate-800">
                                        Routine
                                    </th>
                                    {past30DaysArray.map((dObj, idx) => (
                                        /* added border-l dividing lines across the column headers */
                                        <th key={dObj.toISOString()} className={`pb-3 px-1 text-center text-[9px] font-mono text-stone-400 w-9 border-b border-stone-100 dark:border-slate-800 border-l border-stone-100 dark:border-slate-800/60 bg-white dark:bg-slate-850 ${idx === past30DaysArray.length - 1 ? 'pr-4' : ''}`}>
                                            <div>{dObj.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                                            <div className="text-[8px] opacity-75 mt-0.5">{dObj.getDate()}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                                {habits.map(habit => (
                                    <tr key={habit.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/40">
                                        <td className="sticky left-0 bg-white dark:bg-slate-850 py-2.5 pl-4 pr-4 text-xs font-medium text-stone-800 dark:text-slate-200 truncate max-w-[120px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                                            {habit.name}
                                        </td>

                                        {past30DaysArray.map((dateObj, idx) => {
                                            const dateStr = getLocalDateString(dateObj);
                                            const status = history[dateStr]?.[habit.id];
                                            const isApplicable = isHabitScheduledForDay(habit, dateObj);

                                            let cellBg = "border-stone-200 dark:border-slate-700 bg-transparent";
                                            if (status === 'Done') cellBg = "bg-sage-500 border-sage-600";
                                            if (status === 'Partial') cellBg = "bg-orange-400 border-orange-500";
                                            if (status === 'Missed' && isApplicable) cellBg = "bg-red-400/20 border-red-300/30";

                                            return (
                                                /* added border-l dividing lines across all body cells */
                                                <td key={dateStr} className={`py-2.5 px-1 border-l border-stone-100/70 dark:border-slate-800/40 ${idx === past30DaysArray.length - 1 ? 'pr-4' : ''}`}>
                                                    <div
                                                        className={`w-6 h-6 rounded-md mx-auto border transition-all duration-200 ${cellBg} ${!isApplicable && !status ? 'opacity-20 border-dashed border-stone-200 dark:border-slate-800' : ''}`}
                                                        title={`${habit.name} - ${dateStr} ${!isApplicable ? '(Not Scheduled)' : ''}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Daily Sparkline Progress Graph Container */}
            {habits.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">Daily Trend Analytics</h3>
                    <div className="h-24 flex items-end gap-1 pt-4 border-b border-stone-100 dark:border-slate-800">
                        {graphData.map((day, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-stone-800 text-white dark:bg-slate-100 dark:text-slate-900 text-[8px] font-mono px-1.5 py-0.5 rounded transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-sm">
                                    {day.dateLabel}: {day.percentage}%
                                </div>

                                <div
                                    style={{ height: `${Math.max(day.percentage, 4)}%` }}
                                    className={`w-full rounded-t-sm transition-all duration-300 ${day.percentage > 70 ? 'bg-sage-500' : day.percentage > 30 ? 'bg-orange-400' : 'bg-stone-200 dark:bg-slate-700'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-stone-400">
                        <span>30 Days Ago</span>
                        <span>Today Edge</span>
                    </div>
                </div>
            )}
        </div>
    );
}