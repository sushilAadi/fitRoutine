import React, { useState, useRef, useEffect } from "react";
import { format, isSameDay, isToday, isAfter } from "date-fns";
import { motion } from "framer-motion";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';  // Import default styles

const WeeklyCalendar = ({ selectedDate, setSelectedDate, _weekDays }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const [inputDate, setInputDate] = useState(format(selectedDate, "MM/dd/yyyy"));

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setInputDate(format(newDate, "MM/dd/yyyy"));
    setIsCalendarOpen(false);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && isCalendarOpen) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Ensure Calendar stays within the viewport
  useEffect(() => {
    if (isCalendarOpen && calendarRef.current) {
      const calendarElement = calendarRef.current.querySelector('.react-calendar'); // Target the calendar itself

      if (calendarElement) {
        const rect = calendarElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newLeft = rect.left;
        let newTop = rect.top;

        if (rect.right > windowWidth) {
          newLeft = windowWidth - rect.width - 10; // Adjust to the right edge
        }

        if (rect.bottom > windowHeight) {
          newTop = windowHeight - rect.height - 10; // Adjust to the bottom edge
        }

        calendarElement.style.position = 'fixed'; // Change position to fixed
        calendarElement.style.left = `${Math.max(0, newLeft)}px`; // Ensure not negative
        calendarElement.style.top = `${Math.max(0, newTop)}px`;
      }
    } else if (calendarRef.current && !isCalendarOpen) {
        // Reset styles when calendar closes
        const calendarElement = calendarRef.current.querySelector('.react-calendar');
        if (calendarElement) {
          calendarElement.style.position = '';
          calendarElement.style.left = '';
          calendarElement.style.top = '';
        }
      }
  }, [isCalendarOpen]);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-700">March 2025</h2>

        {/* React-Calendar Implementation */}
        <div ref={calendarRef} className="relative">
          <input
              type="text"
              value={inputDate}
              onClick={toggleCalendar}
              readOnly
              className="p-2 border-none outline-none cursor-pointer"
              style={{width: '120px'}}
            />

          {isCalendarOpen && (
            <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg">
              <Calendar
                value={selectedDate}
                onChange={handleDateChange} // Use handleDateChange here
                maxDate={new Date()} // Disables future dates
                className="react-calendar" // Add a class for custom styling
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between py-2 overflow-x-auto">
        {_weekDays.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isFuture = isAfter(day, new Date());

          return (
            <motion.div
              key={index}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center min-w-12 p-2 rounded-full cursor-pointer
                ${isSelected ? "bg-tprimary text-white" : "text-gray-700"}
                ${isFuture ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onClick={() => !isFuture && setSelectedDate(day)}
            >
              <span className="text-xs">{format(day, "EEE")}</span>
              <span
                className={`font-bold text-lg ${
                  isSelected ? "text-white" : isCurrentDay ? "text-red-500" : "text-gray-800"
                }`}
              >
                {format(day, "d")}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;