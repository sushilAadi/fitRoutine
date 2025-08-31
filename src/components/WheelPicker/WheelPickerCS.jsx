'use client'
import React, { useState, useEffect, useRef } from 'react';

const WheelPickerCS = ({ items, onChange, defaultIndex = 0 }) => {
    
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const wheelRef = useRef(null);
  

  const itemHeight = 40; // Height of each item in pixels
  const visibleItems = 5; // Number of visible items (should be odd)

  useEffect(() => {
    onChange(items[selectedIndex]);
  }, [selectedIndex, items, onChange]);
  
  useEffect(() => {
    if (wheelRef.current) {
      const targetScrollTop = selectedIndex * itemHeight;
      wheelRef.current.scrollTop = targetScrollTop;
    }
  }, [selectedIndex, itemHeight]);

  const handleScroll = () => {
    if (wheelRef.current) {
      const scrollTop = wheelRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      if (index !== selectedIndex && index >= 0 && index < items.length) {
        setSelectedIndex(index);
      }
    }
  };

  const snapToCenter = () => {
    if (wheelRef.current) {
      const scrollTop = wheelRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const targetScrollTop = index * itemHeight;
      wheelRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      setSelectedIndex(index);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const newIndex = Math.min(Math.max(selectedIndex + Math.sign(e.deltaY), 0), items.length - 1);
    setSelectedIndex(newIndex);
  };

  return (
    <div className="relative h-[200px] w-[80px] sm:w-[100px] overflow-hidden">
      <div 
        className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-white to-transparent pointer-events-none z-10"
      />
      <div 
        className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-white to-transparent pointer-events-none z-10"
      />
      <div
        ref={wheelRef}
        className="h-full overflow-auto scrollbar-hide"
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchEnd={snapToCenter}
        onMouseUp={snapToCenter}
        style={{
          paddingTop: `${itemHeight * Math.floor(visibleItems / 2)}px`,
          paddingBottom: `${itemHeight * Math.floor(visibleItems / 2)}px`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-center text-center transition-all duration-150 ${
              index === selectedIndex ? 'text-red-500 text-base sm:text-lg font-bold' : 'text-gray-400 text-sm'
            }`}
            style={{ height: `${itemHeight}px` }}
          >
            {item}
          </div>
        ))}
      </div>
      <div 
        className="absolute top-1/2 left-0 right-0 border-t border-b border-gray-300 pointer-events-none"
        style={{ 
          transform: 'translateY(-50%)',
          height: `${itemHeight}px`
        }}
      />
    </div>
  );
};

export default WheelPickerCS;