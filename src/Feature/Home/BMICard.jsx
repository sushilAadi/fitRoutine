'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const BMICard = ({ bmi, lastUpdate = '9 Jan, 2024 at 10:12' }) => {
  // Calculate the position of the indicator (0-100%)
  const getIndicatorPosition = () => {
    const min = 18
    const max = 30
    const position = ((bmi - min) / (max - min)) * 100
    return Math.min(Math.max(position, 0), 100)
  }

  // Function to determine BMI status and message
  const getBMIStatus = () => {
    if (bmi < 18.5) return "Your BMI is below the healthy range. Consider consulting a healthcare professional for advice on gaining weight safely."
    if (bmi >= 18.5 && bmi < 25) return "Your BMI is within the healthy range. Keep up the good work with your diet and exercise routine!"
    if (bmi >= 25 && bmi < 30) return "Your BMI indicates you're overweight. Consider adopting a healthier lifestyle with balanced diet and regular exercise."
    return "Your BMI indicates obesity. It's recommended to consult a healthcare professional for a personalized weight management plan."
  }

  return (
    <div className="px-4 mx-auto mt-4 bg-white ">

      {/* BMI Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">BMI</h2>
            <p className="text-sm text-gray-500">Last Update: {lastUpdate}</p>
          </div>
          
          <i className="text-2xl text-tprimary fa-duotone fa-solid fa-weight-scale"></i>
          
        </div>

        <div className="text-3xl font-bold">{bmi}</div>

        {/* Progress Bar */}
        <div className="relative pt-6 pb-8">
          <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-red-500" />
          
          {/* Indicator */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-0"
            style={{ left: `${getIndicatorPosition()}%` }}
          >
            <div className="relative flex items-center -mt-2">
              <div className="text-lg font-semibold">{bmi}</div>
              <i className="ml-1 text-xl text-black fas fa-sort-down"></i>
            </div>
          </motion.div>

          {/* Scale Labels */}
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>18</span>
            <span>25</span>
            <span>30</span>
          </div>
        </div>

        <p className="text-sm text-gray-700">{getBMIStatus()}</p>
      </div>
    </div>
  )
}

export default BMICard

