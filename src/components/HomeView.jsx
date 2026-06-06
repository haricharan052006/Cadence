import React, { useState } from 'react';
import { useApp, getLocalDateString } from '../context/AppContext';
import { Flame, Plus, Check, CircleDot, X } from 'lucide-react';

export default function HomeView({ navigateToHabits }) {
    const { userName, habits, history, toggleHabitStatus } = useApp();
    const [activeViewDate, setActiveViewDate] = useState('today');

    const todayObj = new Date();
    const todayStr = getLocalDateString(todayObj);
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayObj);

    const targetDateStr = activeViewDate === 'today' ? todayStr : yesterdayStr;
    const targetDayOfWeek = new Date(targetDateStr).toLocaleDateString('en-US', { weekday: 'short' });

    const activeHabits = habits.filter(h => {
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekdays') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(targetDayOfWeek);
        if (h.frequency === 'weekends') return ['Sat', 'Sun'].includes(targetDayOfWeek);
        if (h.frequency === 'custom') return h.customDays?.includes(targetDayOfWeek);
        return false;
    });

    const targetDayLogs = history[targetDateStr] || {};

    // Calculate completion mathematically: Full Done = 1.0, Partial Work = 0.5
    const completionScore = activeHabits.reduce((acc, habit) => {
        const status = targetDayLogs[habit.id];
        if (status === 'Done') return acc + 1.0;
        if (status === 'Partial') return acc + 0.5;
        return acc;
    }, 0);

    const completionPercentage = activeHabits.length > 0
        ? Math.round((completionScore / activeHabits.length) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Panel */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-slate-50">
                        {todayObj.getHours() < 12 ? 'Good morning' : todayObj.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {userName}
                    </h1>
                    <p className="text-xs font-mono text-sage-600 dark:text-sage-400 uppercase mt-0.5 tracking-wider font-semibold">
                        {new Date(targetDateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, 2026
                    </p>
                </div>

                <div className="flex bg-stone-200/60 dark:bg-slate-800 p-0.5 rounded-lg border border-stone-300/20">
                    <button onClick={() => setActiveViewDate('today')} className={`px-3 py-1 rounded-md text-[11px] font-mono uppercase transition-all ${activeViewDate === 'today' ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-slate-100 font-medium shadow-xs' : 'text-stone-500'}`}>Today</button>
                    <button onClick={() => setActiveViewDate('yesterday')} className={`px-3 py-1 rounded-md text-[11px] font-mono uppercase transition-all ${activeViewDate === 'yesterday' ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-slate-100 font-medium shadow-xs' : 'text-stone-500'}`}>Yesterday</button>
                </div>
            </div>

            {/* Button to navigate to the Habits View instead of the quick add form */}
            <button
                onClick={navigateToHabits}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-100/60 text-orange-800 border border-orange-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold hover:bg-orange-200/40 dark:hover:bg-slate-800 transition-all"
            >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Add Habit
            </button>

            {/* Completion Meter Progress Tracker */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-stone-400">Completion Metrics</span>
                    <span className="font-semibold text-sage-600 dark:text-sage-400">{completionPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sage-500 dark:bg-sage-600 transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
                </div>
            </div>

            {/* List Loop Container */}
            <div className="space-y-1.5">
                {activeHabits.length === 0 ? (
                    <p className="text-center py-8 text-xs font-mono text-stone-400">No processes mapped to this calendar vector.</p>
                ) : (
                    activeHabits.map(habit => {
                        const currentStatus = targetDayLogs[habit.id];

                        // Assign unique soft icon styling frames based on state
                        let statusBtnClass = "bg-stone-50 border-stone-200 text-stone-300 dark:bg-slate-900 dark:border-slate-700 hover:border-red-300 hover:text-red-400";
                        if (currentStatus === 'Done') statusBtnClass = "bg-sage-500 border-sage-600 text-white";
                        if (currentStatus === 'Partial') statusBtnClass = "bg-orange-400 border-orange-500 text-white";

                        return (
                            <div key={habit.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-100 dark:border-slate-700/50">
                                <div className="space-y-0.5">
                                    <p className={`text-sm font-medium ${currentStatus === 'Done' ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-800 dark:text-slate-200'}`}>
                                        {habit.name}
                                    </p>
                                    <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                                        <Flame className={`w-3 h-3 ${habit.streak > 0 ? 'text-orange-400 fill-orange-400/20' : ''}`} />
                                        <span>{habit.streak}d streak</span>
                                    </div>
                                </div>

                                {/* 3-State Toggle Switch Box containing visual icons instead of words */}
                                <button
                                    onClick={() => toggleHabitStatus(habit.id, targetDateStr)}
                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${statusBtnClass}`}
                                    title={currentStatus === 'Done' ? 'Full Completed' : currentStatus === 'Partial' ? 'Partial Work' : 'Off / Unselected'}
                                >
                                    {currentStatus === 'Done' && <Check className="w-5 h-5 stroke-[2.5]" />}
                                    {currentStatus === 'Partial' && <CircleDot className="w-5 h-5 stroke-[2.5]" />}
                                    {!currentStatus && <X className="w-4 h-4 opacity-40 transition-opacity group-hover:opacity-100" />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}