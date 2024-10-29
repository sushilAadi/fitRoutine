'use client'
import React, { useState, useEffect, useRef } from 'react';

const WheelPickerCS = ({ items, onChange }) => {
    
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wheelRef = useRef(null);
  

  const itemHeight = 40; // Height of each item in pixels
  const visibleItems = 5; // Number of visible items (should be odd)

  useEffect(() => {
    onChange(items[selectedIndex]);
  }, [selectedIndex, items, onChange]);
  
  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    if (wheelRef.current) {
      const scrollTop = wheelRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      if (index !== selectedIndex) {
        setSelectedIndex(index);
      }
    }
  };
  const handleWheel = (e) => {
    e.preventDefault();
    const newIndex = Math.min(Math.max(selectedIndex + Math.sign(e.deltaY), 0), items.length - 1);
    setSelectedIndex(newIndex);
  };

  return (
    <div className="relative h-[200px] w-[200px] overflow-hidden">
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
        style={{
          paddingTop: `${itemHeight * Math.floor(visibleItems / 2)}px`,
          paddingBottom: `${itemHeight * Math.floor(visibleItems / 2)}px`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`h-[${itemHeight}px] flex items-center justify-center text-center transition-all duration-150 ${
              index === selectedIndex ? 'text-red-500 text-lg font-bold' : 'text-gray-400'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      <div 
        className="absolute top-1/2 left-0 right-0 h-[40px] border-t border-b border-gray-300 pointer-events-none"
        style={{ transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default WheelPickerCS;