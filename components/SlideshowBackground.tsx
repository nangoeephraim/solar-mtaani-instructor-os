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
    const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));

    // Preload the first image eagerly, others lazily
    useEffect(() => {
        IMAGES.forEach((src, idx) => {
            if (idx === 0) return; // First image is loaded by <img> tag
            const img = new Image();
            img.onload = () => {
                setImagesLoaded(prev => new Set([...prev, idx]));
            };
            // Delay loading non-first images
            setTimeout(() => { img.src = src; }, idx * 1500);
        });
    }, []);

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
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
                    transition={{
                        opacity: { duration: 2, ease: 'easeInOut' },
                        scale: { duration: 8, ease: 'easeOut' }
                    }}
                    className="absolute inset-0 w-full h-full object-cover origin-center will-change-transform"
                    alt="Background Slideshow"
                    loading={currentIndex === 0 ? 'eager' : 'lazy'}
                    fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                />
            </AnimatePresence>
            {/* Premium gradient vignette instead of flat overlay */}
            <div className="absolute inset-0 login-vignette" />
        </div>
    );
};
