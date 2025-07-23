import React, { useState, useRef, useEffect } from 'react';

const WeightScale = ({ initialShowValue = 50, min = 10, max = 250,measurtype,roateText,initialValue,setInitialValue,convertValue }) => {
    const scrollRef = useRef(null);
    const containerRef = useRef(null);
    const ticks = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    const tickWidth = 20; // Width of each tick in pixels

    const scrollToWeight = (targetWeight) => {
        if (scrollRef.current && containerRef.current) {
            const totalWidth = (max - min) * tickWidth;
            const viewportWidth = containerRef.current.offsetWidth;
            const weightPosition = (targetWeight - min) * tickWidth;
            // Clamp the scroll position to avoid over-scrolling beyond the min and max values
            const scrollPosition = Math.max(0, Math.min(totalWidth - viewportWidth, weightPosition - viewportWidth / 2));
            scrollRef.current.scrollLeft = scrollPosition;
        }
    };

    useEffect(() => {
        scrollToWeight(initialShowValue);
    }, [initialShowValue, min, max]);

    const handleScroll = () => {
        if (scrollRef.current && containerRef.current) {
            const scrollPosition = scrollRef.current.scrollLeft;
            const viewportWidth = containerRef.current.offsetWidth;
            const centerPosition = scrollPosition + viewportWidth / 2;
            const newWeight = Math.round(min + centerPosition / tickWidth);
            setInitialValue(Math.max(min, Math.min(max, newWeight)));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto font-sans" ref={containerRef}>
            <div className={`text-4xl font-bold text-center mb-4 ${roateText}`}>
            <p className="text-lg font-normal text-red-500">{convertValue}</p>
                {initialValue} <span className="text-2xl font-normal">{measurtype}</span>
            </div>
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="h-[9rem] overflow-x-auto scrollbar-hide relative"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onScroll={handleScroll}
                >
                    <div className="absolute top-0 left-0 flex items-center h-full" style={{ width: `${(max - min + 1) * tickWidth}px` }}>
                        {ticks.map((tick) => (
                            <div key={tick} className="flex flex-col items-center" style={{ width: `${tickWidth}px` }}>
                                <div className={`h-${tick % 10 === 0 ? '12' : tick % 5 === 0 ? '6' : '4'} w-px ${initialValue === tick && "w-[3px] rounded-full"} bg-red-400`} />
                                { (
                                    <div className="flex flex-col items-center">
                                        <span className={`text-xs mt-1 ${initialValue === tick && "font-bold "}`}>{tick}</span>
                                        {initialValue === tick && (
                                            <i className="mt-1 text-red-500 fa-solid fa-caret-up" />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeightScale;
