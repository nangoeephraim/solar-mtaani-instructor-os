import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
    '/slideshow/new_slide1.png',
    '/slideshow/new_slide2.png',
    '/slideshow/new_slide3.png',
    '/slideshow/new_slide4.png'
];

export const SlideshowBackground: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Change image every 7 seconds
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
        }, 7000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900 z-0">
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={currentIndex}
                    src={IMAGES[currentIndex]}
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
                    transition={{
                        opacity: { duration: 2, ease: 'easeInOut' },
                        scale: { duration: 8, ease: 'easeOut' }
                    }}
                    className="absolute inset-0 w-full h-full object-cover origin-center"
                    alt="Background Slideshow"
                />
            </AnimatePresence>
            {/* Dark overlay to ensure login card contrast */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
    );
};
