import React, { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy-load each background for performance
const DataStream = lazy(() => import('./DataStream'));
const ParticleNetwork = lazy(() => import('./ParticleNetwork'));
const TimeGrid = lazy(() => import('./TimeGrid'));
const ZenGradient = lazy(() => import('./ZenGradient'));

interface BackgroundLayoutProps {
    currentView: string;
}

type BgKey = 'data' | 'people' | 'time' | 'zen';

const viewToBg: Record<string, BgKey> = {
    dashboard: 'data',
    analytics: 'data',
    schedule: 'time',
    'students-manage': 'people',
    students: 'people',
    'student-analytics': 'people',
    attendance: 'people',
    assessment: 'zen',
    resources: 'zen',
    settings: 'zen',
};

const bgComponents: Record<BgKey, React.LazyExoticComponent<React.FC>> = {
    data: DataStream,
    people: ParticleNetwork,
    time: TimeGrid,
    zen: ZenGradient,
};

const BackgroundLayout: React.FC<BackgroundLayoutProps> = ({ currentView }) => {
    const bgKey = viewToBg[currentView] ?? 'zen';
    const BgComponent = bgComponents[bgKey];

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Suspense fallback={null}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={bgKey}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                    >
                        <BgComponent />
                    </motion.div>
                </AnimatePresence>
            </Suspense>
        </div>
    );
};

export default React.memo(BackgroundLayout);
