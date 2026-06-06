import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2 } from 'lucide-react';

export default function HabitsView() {
    const { habits, addHabit, deleteHabit } = useApp();
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [customDays, setCustomDays] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    const weekdaysIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handleDayToggle = (day) => {
        setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (frequency === 'custom' && customDays.length === 0) return;

        addHabit(name.trim(), frequency, frequency === 'custom' ? customDays : []);
        setName('');
        setCustomDays([]);
        setFrequency('daily');
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-stone-200 dark:border-slate-800 pb-3">
                <h1 className="text-xl font-semibold text-stone-900 dark:text-slate-50">Habits Studio</h1>
                <p className="text-xs font-mono text-stone-400 mt-0.5">Manage routine tracking rules.</p>
            </div>

            <form onSubmit={handleCreate} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700/80 space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-stone-400 block">Habit Label</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Label text..."
                        className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-800 dark:text-slate-100 focus:outline-none focus:border-sage-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-stone-400 block">Schedule Rule</label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-stone-800 dark:text-slate-100 focus:outline-none focus:border-sage-500"
                    >
                        <option value="daily">Every Day</option>
                        <option value="weekdays">Weekdays (M - F)</option>
                        <option value="weekends">Weekends (S - S)</option>
                        <option value="custom">Custom Days Selection</option>
                    </select>
                </div>

                {frequency === 'custom' && (
                    <div className="flex flex-wrap gap-1 p-2 bg-stone-50 dark:bg-slate-900 rounded-lg border border-stone-100 dark:border-slate-800">
                        {weekdaysIndex.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                className={`px-2.5 py-1 rounded text-xs font-mono ${customDays.includes(day) ? 'bg-sage-500 text-white font-medium' : 'bg-white dark:bg-slate-800 text-stone-400 border border-stone-200 dark:border-slate-700'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}

                <button type="submit" className="w-full py-2 bg-stone-800 hover:bg-stone-700 dark:bg-slate-100 dark:text-slate-900 text-white rounded-lg text-xs font-mono uppercase font-semibold transition-all">
                    Create Habit
                </button>
            </form>

            {/* Routine Database Index List */}
            <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase text-stone-400 px-1">Registered Schedules</h3>
                {habits.length === 0 ? (
                    <p className="text-center py-6 text-xs text-stone-400 border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">No profiles active.</p>
                ) : (
                    habits.map(habit => (
                        <div key={habit.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
                            {deletingId !== habit.id ? (
                                <>
                                    <div className="truncate">
                                        <h4 className="text-xs font-medium text-stone-800 dark:text-slate-200 truncate">{habit.name}</h4>
                                        <span className="text-[10px] font-mono text-stone-400 block mt-0.5 capitalize">
                                            🔁 {habit.frequency === 'custom' ? habit.customDays.join(', ') : habit.frequency}
                                        </span>
                                    </div>
                                    <button onClick={() => setDeletingId(habit.id)} className="p-1.5 text-stone-400 hover:text-red-500 rounded transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                /* simplified confirmation text box */
                                <div className="w-full flex items-center justify-between bg-red-50 dark:bg-red-950/20 p-1.5 rounded-lg border border-red-200 dark:border-red-900/30">
                                    <span className="text-xs font-mono text-red-500 font-semibold">Delete?</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => { deleteHabit(habit.id); setDeletingId(null); }} className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-mono rounded font-bold uppercase">Yes</button>
                                        <button onClick={() => setDeletingId(null)} className="px-2.5 py-0.5 bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200 text-xs font-mono rounded uppercase">No</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}