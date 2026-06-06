import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export default function SettingsView({ onRequestReset }) {
    const { habits, history, theme, setTheme } = useApp();

    const totalHabits = habits.length;
    const daysTracked = Object.keys(history).filter(k => Object.keys(history[k]).length > 0).length;

    const handleExportToExcel = async () => {
        let rawCsv = "Date,Habit Name,Status\n";
        Object.keys(history).forEach(date => {
            Object.keys(history[date]).forEach(hId => {
                const h = habits.find(item => item.id === hId);
                rawCsv += `"${date}","${h ? h.name.replace(/"/g, '""') : 'Deleted Habit'}","${history[date][hId]}"\n`;
            });
        });

        if (Capacitor.isNativePlatform()) {
            try {
                const base64Data = btoa(unescape(encodeURIComponent(rawCsv)));
                const result = await Filesystem.writeFile({
                    path: 'personal_os_ledger.csv',
                    data: base64Data,
                    directory: Directory.Cache
                });
                await Share.share({
                    title: 'Export Excel',
                    url: result.uri
                });
            } catch (error) {
                console.error('Error exporting file:', error);
                alert('Export failed: ' + error.message);
            }
        } else {
            const csvContent = "data:text/csv;charset=utf-8," + rawCsv;
            const link = document.createElement("a");
            link.setAttribute("href", encodeURI(csvContent));
            link.setAttribute("download", `personal_os_ledger.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-stone-200 dark:border-slate-800 pb-3">
                <h1 className="text-xl font-semibold text-stone-900 dark:text-slate-50">Settings Hub</h1>
                <p className="text-xs font-mono text-stone-400 mt-0.5">Global configuration node.</p>
            </div>

            {/* Numerical Stats Deck */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-100 dark:border-slate-700/50">
                    <span className="text-stone-400 block">Total Habits</span>
                    <span className="text-base font-bold text-stone-800 dark:text-slate-200 mt-0.5 block">{totalHabits}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-100 dark:border-slate-700/50">
                    <span className="text-stone-400 block">Days Tracked</span>
                    <span className="text-base font-bold text-stone-800 dark:text-slate-200 mt-0.5 block">{daysTracked}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 divide-y divide-stone-100 dark:divide-slate-700 overflow-hidden text-xs">

                {/* Theme Switcher Rows */}
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-stone-800 dark:text-slate-200">App Theme</h3>
                        <p className="text-[11px] text-stone-400">Switch display mode.</p>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg font-mono text-[11px] uppercase"
                    >
                        {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                    </button>
                </div>

                {/* Share & Download Layout Block */}
                <div className="p-4 space-y-3">
                    <h3 className="font-medium text-stone-800 dark:text-slate-200">Data Actions</h3>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button onClick={() => { navigator.clipboard.writeText("https://drive.google.com/drive/folders/1-KAM0qL_eQvWhVXR1wTyrMn9wTDoW6YM?usp=sharing"); alert("App link copied."); }} className="p-2 bg-stone-50 dark:bg-slate-900 rounded-lg font-mono text-[10px] text-center uppercase border border-stone-200 dark:border-slate-700">
                            Share App
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(`Tracking ${totalHabits} items across ${daysTracked} days.`); alert("Metrics ledger copied."); }} className="p-2 bg-stone-50 dark:bg-slate-900 rounded-lg font-mono text-[10px] text-center uppercase border border-stone-200 dark:border-slate-700">
                            Share Progress
                        </button>
                        <button onClick={handleExportToExcel} className="p-2 bg-stone-50 dark:bg-slate-900 rounded-lg font-mono text-[10px] text-center uppercase border border-stone-200 dark:border-slate-700">
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Danger Zone — delegates to shell's ConfirmDialog via onRequestReset prop */}
                <div className="p-4 bg-stone-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-stone-800 dark:text-slate-200">System Reset</h3>
                            <p className="text-[11px] text-stone-400">Clear all saved cache items.</p>
                        </div>
                        <button
                            id="settings-reset-btn"
                            onClick={onRequestReset}
                            className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg font-mono text-[11px] uppercase hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}