// ─── PRISM Meetings — Isolated Timer Component ───
// Prevents full component re-renders every second

import React, { useState, useEffect, useRef } from 'react';

const MeetingTimer = React.memo(({ active }: { active: boolean }) => {
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (active) {
            setSeconds(0);
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setSeconds(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [active]);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    const display = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
    return (
        <div className="bg-[#1a1b1e] px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold font-google text-white/70 tabular-nums">
            {display}
        </div>
    );
});

MeetingTimer.displayName = 'MeetingTimer';

export default MeetingTimer;
