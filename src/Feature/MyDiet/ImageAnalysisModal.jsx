import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const ImageAnalysisModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  analysisData, 
  setAnalysisData, 
  isAnalyzing, 
  foodAnalysis, 
  setFoodAnalysis 
}) => {
  const [saveAnalysis, setSaveAnalysis] = useState(false)
  
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white z-[999999999]"
      >
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {isAnalyzing ? "Analyzing Food..." : "Food Analysis"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 rounded-full hover:bg-gray-100 active:bg-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="h-full pt-16 pb-24 overflow-y-auto"
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="mt-6 text-lg text-gray-600">Analyzing your food...</p>
              <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
            </div>
          ) : (
            <div className="px-4 py-6 space-y-6">
              {/* Food Name */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Food Name
                </label>
                <input
                  type="text"
                  value={analysisData.food || ""}
                  onChange={(e) => setAnalysisData({ ...analysisData, food: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Chicken Salad"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Quantity/Weight
                </label>
                <input
                  type="text"
                  value={analysisData.quantity || ""}
                  onChange={(e) => setAnalysisData({ ...analysisData, quantity: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 200g or 1 serving"
                />
              </div>

              {/* Additional Ingredients */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Additional Ingredients
                  <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={analysisData.ingredients || ""}
                  onChange={(e) => setAnalysisData({ ...analysisData, ingredients: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="e.g., olive oil dressing, nuts, cheese"
                />
              </div>

              {/* Nutrition Values */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-900">Nutritional Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Calories
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={analysisData.calories || ""}
                        onChange={(e) => setAnalysisData({ ...analysisData, calories: e.target.value })}
                        className="w-full px-3 py-2.5 pr-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute text-sm text-gray-500 -translate-y-1/2 right-3 top-1/2">
                        kcal
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Carbs
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={analysisData.carbs || ""}
                        onChange={(e) => setAnalysisData({ ...analysisData, carbs: e.target.value })}
                        className="w-full px-3 py-2.5 pr-8 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute text-sm text-gray-500 -translate-y-1/2 right-3 top-1/2">
                        g
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Protein
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={analysisData.protein || ""}
                        onChange={(e) => setAnalysisData({ ...analysisData, protein: e.target.value })}
                        className="w-full px-3 py-2.5 pr-8 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute text-sm text-gray-500 -translate-y-1/2 right-3 top-1/2">
                        g
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      Fats
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={analysisData.fats || ""}
                        onChange={(e) => setAnalysisData({ ...analysisData, fats: e.target.value })}
                        className="w-full px-3 py-2.5 pr-8 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="absolute text-sm text-gray-500 -translate-y-1/2 right-3 top-1/2">
                        g
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Food Analysis Section */}
              {foodAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 space-y-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100"
                >
                  <h4 className="text-sm font-semibold text-gray-900">AI Food Analysis</h4>
                  
                  {/* Pros */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <h5 className="text-sm font-medium text-green-700">Benefits</h5>
                    </div>
                    <ul className="space-y-1 ml-7">
                      {foodAnalysis.pros?.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-700">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Cons */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <h5 className="text-sm font-medium text-red-700">Considerations</h5>
                    </div>
                    <ul className="space-y-1 ml-7">
                      {foodAnalysis.cons?.map((con, index) => (
                        <li key={index} className="text-sm text-gray-700">• {con}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Suggestion */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <h5 className="text-sm font-medium text-blue-700">Suggestion</h5>
                    </div>
                    <p className="text-sm text-gray-700 ml-7">{foodAnalysis.suggestion}</p>
                  </div>

                  {/* Save Analysis Checkbox */}
                  <label className="flex items-start gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAnalysis}
                      onChange={(e) => setSaveAnalysis(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      Save this analysis for future reference
                    </span>
                  </label>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Bottom Actions */}
        {!isAnalyzing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <div className="flex gap-3 p-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(saveAnalysis)}
                className="flex-1 px-4 py-3 text-base font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 active:bg-orange-700"
              >
                Use These Values
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default ImageAnalysisModal