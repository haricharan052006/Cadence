import React, { useState } from 'react';
import {
    Home,
    LayoutGrid,
    ListChecks,
    Settings,
    Sparkles,
    ArrowRight,
    Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import HomeView from './HomeView';
import MatrixView from './MatrixView';
import HabitsView from './HabitsView';
import SettingsView from './SettingsView';

// ---------------------------------------------------------------------------
// Bottom nav definition
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
    { id: 'home',     label: 'Home',     Icon: Home },
    { id: 'matrix',   label: 'Matrix',   Icon: LayoutGrid },
    { id: 'habits',   label: 'Habits',   Icon: ListChecks },
    { id: 'settings', label: 'Settings', Icon: Settings },
];

// ---------------------------------------------------------------------------
// Welcome / Onboarding Screen
// ---------------------------------------------------------------------------
function WelcomeScreen({ onStart }) {
    const [value, setValue] = useState('');

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-6 animate-fadeIn">
            {/* Logo mark */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-500 text-white shadow-lg dark:bg-sage-600">
                <Sparkles className="h-7 w-7" strokeWidth={2} />
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-800 dark:text-slate-100">
                Welcome to Cadence.
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500 dark:text-slate-400">
                Enter your name to begin tracking your daily rhythm.
            </p>

            <div className="mt-8 w-full max-w-xs space-y-3">
                <input
                    id="welcome-name-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && value.trim()) onStart(value.trim());
                    }}
                    placeholder="Your name"
                    autoFocus
                    className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-center text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-sage-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sage-500 transition-colors"
                />
                <button
                    id="welcome-get-started-btn"
                    onClick={() => onStart(value.trim() || 'Friend')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                    Get Started
                    <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Confirmation Modal Portal
// ---------------------------------------------------------------------------
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm dark:bg-black/60"
                onClick={onCancel}
            />
            {/* Panel */}
            <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 animate-fadeIn">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50 mb-4">
                    <Trash2 className="h-5 w-5 text-red-500" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-stone-800 dark:text-slate-100">
                    {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-slate-400">
                    {message}
                </p>
                <div className="mt-6 flex gap-2.5">
                    <button
                        id="confirm-dialog-cancel-btn"
                        onClick={onCancel}
                        className="flex-1 rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    >
                        No, cancel
                    </button>
                    <button
                        id="confirm-dialog-proceed-btn"
                        onClick={onConfirm}
                        className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                    >
                        Yes, wipe it
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// HabitTracker — main shell layout
// Owns only local UI state (activeTab, confirmOpen).
// All data comes from useApp().
// ---------------------------------------------------------------------------
export default function HabitTracker() {
    const { userName, setUserName, resetAllData, theme } = useApp();
    const [activeTab,    setActiveTab]    = useState('home');
    const [confirmOpen,  setConfirmOpen]  = useState(false);

    // Wrap the dark class on the root shell div so Tailwind's dark variant works
    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} w-screen overflow-x-hidden`}>
            <div className="w-screen overflow-x-hidden min-h-screen bg-stone-50 font-sans text-stone-800 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">

                {/* ── Onboarding gate ─────────────────────────────────────── */}
                {!userName ? (
                    <div className="mx-auto max-w-md px-4 pt-8">
                        {/* Brand wordmark even on welcome */}
                        <header className="mb-2 flex items-center gap-2 justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-500 text-white dark:bg-sage-600">
                                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </div>
                            <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-stone-600 dark:text-slate-300">
                                Cadence
                            </span>
                        </header>
                        <WelcomeScreen onStart={(name) => setUserName(name)} />
                    </div>
                ) : (
                    /* ── Main app shell ──────────────────────────────────── */
                    <>
                        <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-32 pt-6">

                            {/* Brand header */}
                            <header
                                id="app-header"
                                className="mb-5 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-500 text-white dark:bg-sage-600">
                                        <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                                    </div>
                                    <span className="font-mono text-sm font-medium uppercase tracking-[0.2em] text-stone-700 dark:text-slate-200">
                                        Cadence
                                    </span>
                                </div>

                                {/* Quick navigate to Habits tab from header */}
                                <button
                                    id="header-habits-shortcut-btn"
                                    onClick={() => setActiveTab('habits')}
                                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400 transition-colors hover:text-sage-600 dark:text-slate-500 dark:hover:text-sage-400"
                                >
                                    + Habit
                                </button>
                            </header>

                            {/* Main content area — tab router */}
                            <main className="flex-1">
                                {activeTab === 'home' && (
                                    <HomeView navigateToHabits={() => setActiveTab('habits')} />
                                )}
                                {activeTab === 'matrix' && (
                                    <MatrixView />
                                )}
                                {activeTab === 'habits' && (
                                    <HabitsView />
                                )}
                                {activeTab === 'settings' && (
                                    <SettingsView onRequestReset={() => setConfirmOpen(true)} />
                                )}
                            </main>
                        </div>

                        {/* ── Fixed bottom dock ─────────────────────────── */}
                        <nav
                            id="bottom-nav-dock"
                            className="fixed inset-x-0 bottom-0 z-50 bg-stone-50 dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 pt-3"
                        >
                            <div className="mx-auto max-w-xl px-4 pb-4">
                                {/* Glass pill */}
                                <div className="rounded-2xl border border-stone-200 bg-stone-100/90 p-1.5 shadow-lg shadow-stone-200/50 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/40">
                                    <div className="grid grid-cols-4 gap-1">
                                        {NAV_ITEMS.map(({ id, label, Icon }) => {
                                            const active = activeTab === id;
                                            return (
                                                <button
                                                    key={id}
                                                    id={`nav-btn-${id}`}
                                                    onClick={() => setActiveTab(id)}
                                                    className={
                                                        'flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200 ' +
                                                        (active
                                                            ? 'bg-stone-800 text-stone-50 dark:bg-slate-100 dark:text-slate-900'
                                                            : 'text-stone-500 hover:bg-stone-200/60 dark:text-slate-400 dark:hover:bg-slate-700/60')
                                                    }
                                                >
                                                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                                                    <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                                                        {label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Developer credit */}
                                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 dark:text-slate-600">
                                    Developed by Hari Charan
                                </p>
                            </div>
                        </nav>

                        {/* ── Global reset confirmation modal ───────────── */}
                        <ConfirmDialog
                            open={confirmOpen}
                            title="Wipe all data?"
                            message="This will permanently remove every habit, its full tracking history, and your profile name. This action cannot be undone."
                            onConfirm={() => {
                                resetAllData();
                                setConfirmOpen(false);
                                setActiveTab('home');
                            }}
                            onCancel={() => setConfirmOpen(false)}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
