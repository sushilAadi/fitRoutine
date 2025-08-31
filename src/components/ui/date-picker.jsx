"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

function CustomDatePicker({ 
  selected, 
  onSelect, 
  disabled = {}, 
  fromYear = 1940, 
  toYear = new Date().getFullYear(),
  className,
  ...props 
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth()) : new Date()
  )

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const years = Array.from(
    { length: toYear - fromYear + 1 }, 
    (_, i) => toYear - i
  )

  const handleMonthChange = (monthIndex) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex))
  }

  const handleYearChange = (year) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth()))
  }

  return (
    <div className={cn("w-full max-w-sm mx-auto", className)}>
      {/* Custom Header with Dropdowns */}
      <div className="flex items-center justify-center gap-4 mb-4 p-2">
        <select
          value={currentMonth.getMonth()}
          onChange={(e) => handleMonthChange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 cursor-pointer text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {months.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={currentMonth.getFullYear()}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 cursor-pointer text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        disabled={disabled}
        className="w-full"
        {...props}
      />
    </div>
  )
}

export { CustomDatePicker }