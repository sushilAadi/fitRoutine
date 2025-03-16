"use client"

import { useState, useRef, useEffect } from "react"
import { format, isSameDay, isToday, addDays, subDays } from "date-fns"
import { motion } from "framer-motion"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css" // Import default styles
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import { FreeMode } from "swiper/modules"

const WeeklyCalendar = ({ selectedDate, setSelectedDate, _weekDays }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef(null)
  const swiperRef = useRef(null)
  const [inputDate, setInputDate] = useState(format(selectedDate, "MM/dd/yyyy"))
  const today = new Date()

  // Set today as the selected date on initial render
  useEffect(() => {
    if (!isSameDay(selectedDate, today)) {
      setSelectedDate(today)
      setInputDate(format(today, "MM/dd/yyyy"))
    }
  }, [])

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen)
  }

  // Generate dates for the full calendar (past and future)
  // 30 days before today and 30 days after today
  const pastDays = [...Array(30)].map((_, i) => subDays(today, 30 - i))
  const futureDays = [...Array(30)].map((_, i) => addDays(today, i + 1))

  // Combine past, today, and future days
  const allDays = [...pastDays, today, ...futureDays]

  // Remove duplicates and sort chronologically
  const uniqueDays = allDays
    .filter((day, index, self) => self.findIndex((d) => isSameDay(d, day)) === index)
    .sort((a, b) => a - b)

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    setInputDate(format(newDate, "MM/dd/yyyy"))
    setIsCalendarOpen(false)
    
    // Find the index of the selected date in uniqueDays
    const selectedIndex = uniqueDays.findIndex((day) => isSameDay(day, newDate))
    
    // Scroll to the selected date if it exists in uniqueDays
    if (selectedIndex !== -1 && swiperRef.current && swiperRef.current.swiper) {
      setTimeout(() => {
        swiperRef.current.swiper.slideTo(selectedIndex, 300)
      }, 100)
    }
  }

  // Center today's date when component mounts
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      const swiper = swiperRef.current.swiper
      const todayIndex = uniqueDays.findIndex((day) => isToday(day))

      if (todayIndex !== -1) {
        // Add a small delay to ensure swiper is fully initialized
        setTimeout(() => {
          swiper.slideTo(todayIndex, 300)
        }, 100)
      }
    }
  }, [swiperRef.current])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && isCalendarOpen) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])

  // Ensure Calendar stays within the viewport
  useEffect(() => {
    if (isCalendarOpen && calendarRef.current) {
      const calendarElement = calendarRef.current.querySelector(".react-calendar") // Target the calendar itself

      if (calendarElement) {
        const rect = calendarElement.getBoundingClientRect()
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        let newLeft = rect.left
        let newTop = rect.top

        if (rect.right > windowWidth) {
          newLeft = windowWidth - rect.width - 10 // Adjust to the right edge
        }

        if (rect.bottom > windowHeight) {
          newTop = windowHeight - rect.height - 10 // Adjust to the bottom edge
        }

        calendarElement.style.position = "fixed" // Change position to fixed
        calendarElement.style.left = `${Math.max(0, newLeft)}px` // Ensure not negative
        calendarElement.style.top = `${Math.max(0, newTop)}px`
      }
    } else if (calendarRef.current && !isCalendarOpen) {
      // Reset styles when calendar closes
      const calendarElement = calendarRef.current.querySelector(".react-calendar")
      if (calendarElement) {
        calendarElement.style.position = ""
        calendarElement.style.left = ""
        calendarElement.style.top = ""
      }
    }
  }, [isCalendarOpen])

  // Find today's index for initial slide
  const todayIndex = uniqueDays.findIndex((day) => isToday(day))

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-700">{format(selectedDate, "MMMM yyyy")}</h2>

        {/* React-Calendar Implementation */}
        <div ref={calendarRef} className="relative">
          <input
            type="text"
            value={inputDate}
            onClick={toggleCalendar}
            readOnly
            className="p-2 border-none outline-none cursor-pointer"
            style={{ width: "120px" }}
          />

          {isCalendarOpen && (
            <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg">
              <Calendar value={selectedDate} onChange={handleDateChange} className="react-calendar" maxDate={new Date()} />
            </div>
          )}
        </div>
      </div>

      <div className="py-2">
        <Swiper
          ref={swiperRef}
          slidesPerView="auto"
          spaceBetween={5}
          freeMode={true}
          modules={[FreeMode]}
          className="mySwiper"
          initialSlide={todayIndex !== -1 ? todayIndex : 0}
          centeredSlides={true}
          slideToClickedSlide={true}
        >
          {uniqueDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentDay = isToday(day)

            return (
              <SwiperSlide key={index} style={{ width: "auto" }}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center p-2 mx-1 rounded-full cursor-pointer
                    ${isSelected ? "bg-tprimary text-white" : "text-gray-700"}
                  `}
                  onClick={() => setSelectedDate(day)}
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
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

export default WeeklyCalendar