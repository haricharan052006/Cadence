import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Pure date helper — always uses LOCAL wall-clock, never UTC
// ---------------------------------------------------------------------------
export function getLocalDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const LS_KEYS = {
    user: 'cadence_user',
    habits: 'cadence_habits',
    history: 'cadence_history',
    theme: 'cadence_theme',
};

function lsRead(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function lsWrite(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // quota exceeded or private mode — silent fail
    }
}

// ---------------------------------------------------------------------------
// 3-state cycle: undefined → 'Done' → 'Partial' → undefined
// ---------------------------------------------------------------------------
function cycleStatus(current) {
    if (!current) return 'Done';
    if (current === 'Done') return 'Partial';
    return null; // Partial → remove key (off)
}

// ---------------------------------------------------------------------------
// Streak recalculation for a single habit
// ---------------------------------------------------------------------------
function recalcStreak(habit, history) {
    let streak = 0;
    const cursor = new Date();
    // Start from yesterday and walk backwards (today may still be in progress)
    cursor.setDate(cursor.getDate() - 1);

    for (let i = 0; i < 365; i++) {
        const dateStr = getLocalDateString(cursor);
        const dayOfWeek = cursor.toLocaleDateString('en-US', { weekday: 'short' });

        const isScheduled =
            habit.frequency === 'daily' ? true :
                habit.frequency === 'weekdays' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayOfWeek) :
                    habit.frequency === 'weekends' ? ['Sat', 'Sun'].includes(dayOfWeek) :
                        habit.frequency === 'custom' ? (habit.customDays || []).includes(dayOfWeek) :
                            false;

        if (!isScheduled) {
            cursor.setDate(cursor.getDate() - 1);
            continue;
        }

        const status = history[dateStr]?.[habit.id];
        if (status === 'Done' || status === 'Partial') {
            streak++;
        } else {
            break;
        }
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AppContext = createContext(null);

export function AppProvider({ children }) {
    // ---- State initialisation from localStorage ----
    const [userName, setUserNameState] = useState(() => lsRead(LS_KEYS.user, null));
    const [habits, setHabits] = useState(() => lsRead(LS_KEYS.habits, []));
    const [history, setHistory] = useState(() => lsRead(LS_KEYS.history, {}));
    const [theme, setThemeState] = useState(() => lsRead(LS_KEYS.theme, 'light'));
    const [systemDateStr, setSystemDateStr] = useState(() => getLocalDateString(new Date()));

    // Track the date string the last midnight-sweep ran against
    const lastSweptDateRef = useRef(systemDateStr);

    // ---- Theme engine: sync <html> class ----
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // ---- Midnight sweep: detect day rollover every 60s ----
    useEffect(() => {
        const checkMidnight = () => {
            const nowStr = getLocalDateString(new Date());
            if (nowStr !== systemDateStr) {
                // Day rolled over — mark un-logged habits from the old day as 'Missed'
                const oldDateStr = systemDateStr;
                setHistory(prev => {
                    const updated = { ...prev };
                    const oldDayLog = { ...(updated[oldDateStr] || {}) };
                    const oldDayObj = new Date(oldDateStr + 'T00:00:00');
                    const oldDayOfWeek = oldDayObj.toLocaleDateString('en-US', { weekday: 'short' });

                    habits.forEach(habit => {
                        const isScheduled =
                            habit.frequency === 'daily' ? true :
                                habit.frequency === 'weekdays' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(oldDayOfWeek) :
                                    habit.frequency === 'weekends' ? ['Sat', 'Sun'].includes(oldDayOfWeek) :
                                        habit.frequency === 'custom' ? (habit.customDays || []).includes(oldDayOfWeek) :
                                            false;

                        if (isScheduled && !oldDayLog[habit.id]) {
                            oldDayLog[habit.id] = 'Missed';
                        }
                    });

                    updated[oldDateStr] = oldDayLog;
                    lsWrite(LS_KEYS.history, updated);
                    return updated;
                });

                lastSweptDateRef.current = nowStr;
                setSystemDateStr(nowStr);
            }
        };

        const id = setInterval(checkMidnight, 60_000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemDateStr, habits]);

    // ---- localStorage persistence watchers ----
    useEffect(() => { lsWrite(LS_KEYS.user, userName); }, [userName]);
    useEffect(() => { lsWrite(LS_KEYS.habits, habits); }, [habits]);
    useEffect(() => { lsWrite(LS_KEYS.history, history); }, [history]);
    useEffect(() => { lsWrite(LS_KEYS.theme, theme); }, [theme]);

    // ---- Actions ----

    const setUserName = useCallback((name) => {
        setUserNameState(name);
    }, []);

    /**
     * 3-state toggle: undefined → Done → Partial → undefined
     * Only permitted for today and yesterday.
     * Mathematical score rule: Done = 1.0 pt, Partial = 0.5 pt
     */
    const toggleHabitStatus = useCallback((habitId, dateStr) => {
        const todayStr = getLocalDateString(new Date());
        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterdayObj);

        // Date guard — only today and yesterday are editable
        if (dateStr !== todayStr && dateStr !== yesterdayStr) return;

        setHistory(prev => {
            const dayLog = { ...(prev[dateStr] || {}) };
            const next = cycleStatus(dayLog[habitId]);

            if (next === null) {
                delete dayLog[habitId];
            } else {
                dayLog[habitId] = next;
            }

            const updated = { ...prev, [dateStr]: dayLog };

            // Recalculate streaks for the affected habit
            setHabits(prevHabits =>
                prevHabits.map(h =>
                    h.id === habitId
                        ? { ...h, streak: recalcStreak(h, updated) }
                        : h
                )
            );

            return updated;
        });
    }, []);

    /**
     * Add a new habit definition.
     * id is stringified timestamp for stable JSON serialisation.
     */
    const addHabit = useCallback((name, frequency, customDays = []) => {
        const newHabit = {
            id: Date.now().toString(),
            name: name.trim(),
            frequency,  // 'daily' | 'weekdays' | 'weekends' | 'custom'
            customDays: frequency === 'custom' ? customDays : [],
            streak: 0,
        };
        setHabits(prev => [...prev, newHabit]);
    }, []);

    /**
     * Delete a habit and prune all its history entries.
     */
    const deleteHabit = useCallback((habitId) => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setHistory(prev => {
            const updated = {};
            Object.keys(prev).forEach(dateStr => {
                const dayLog = { ...prev[dateStr] };
                delete dayLog[habitId];
                updated[dateStr] = dayLog;
            });
            return updated;
        });
    }, []);

    /**
     * Wipe everything — habits, history, user name, theme reset to light.
     */
    const resetAllData = useCallback(() => {
        Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
        setUserNameState(null);
        setHabits([]);
        setHistory({});
        setThemeState('light');
    }, []);

    const setTheme = useCallback((t) => {
        setThemeState(t);
    }, []);

    // ---- Context value ----
    const value = {
        // State
        userName,
        habits,
        history,
        theme,
        systemDateStr,
        // Actions
        setUserName,
        toggleHabitStatus,
        addHabit,
        deleteHabit,
        resetAllData,
        setTheme,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

/**
 * Custom hook — throws a descriptive error if used outside AppProvider.
 */
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error('useApp() must be used inside <AppProvider>. Check your component tree.');
    }
    return ctx;
}
