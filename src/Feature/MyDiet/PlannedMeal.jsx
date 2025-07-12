"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Accordion, AccordionHeader, AccordionBody, Menu, MenuHandler, MenuList, MenuItem } from "@material-tailwind/react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { format, isEqual, startOfDay } from "date-fns"
import { db, geminiModel } from "@/firebase/firebaseConfig"
import toast from "react-hot-toast"
import ImageAnalysisModal from "./ImageAnalysisModal"

// Remove the CameraOptionsModal component since we'll use Material Tailwind Menu

// Food Info Modal Component
const FoodInfoModal = ({ isOpen, onClose, foodInfo }) => {
  if (!isOpen || !foodInfo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md p-6 mx-4 bg-white rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Food Information</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="text-xl fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold text-green-600">✅ Pros</h4>
              <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                {foodInfo.pros?.map((pro, index) => (
                  <li key={index}>{pro}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="mb-2 font-semibold text-red-600">❌ Cons</h4>
              <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                {foodInfo.cons?.map((con, index) => (
                  <li key={index}>{con}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="mb-2 font-semibold text-blue-600">💡 Suggestions</h4>
              <p className="text-sm text-gray-700">{foodInfo.suggestion}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const PlannedMeal = ({ dietList, openAccordion, handleOpenAccordion, userId, selectedDate, dietId, handleRefetch }) => {
  const mealCategories = ["Breakfast", "Lunch", "Snack", "Exercise", "Dinner"]
  const [userMeals, setUserMeals] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingMeal, setEditingMeal] = useState(null)
  const [newMealForms, setNewMealForms] = useState({})
  const [newMealData, setNewMealData] = useState({})
  const [localMeals, setLocalMeals] = useState({})
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false)
  const [retryCounts, setRetryCounts] = useState({})
  
  // New states for image analysis and food info
  const [imageAnalysisModal, setImageAnalysisModal] = useState({ isOpen: false, category: null, mealId: null, isNewMeal: false })
  const [analysisData, setAnalysisData] = useState({})
  const [foodAnalysis, setFoodAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRefs = useRef({})
  const cameraInputRefs = useRef({})
  
  // Food info modal states
  const [foodInfoModal, setFoodInfoModal] = useState({ isOpen: false, foodInfo: null })

  const inputRefs = useRef({})

  useEffect(() => {
    const fetchUserMeals = async () => {
      setLoading(true)
      try {
        const mealCollectionRef = collection(db, "meals")
        let q
        if (dietId) {
          q = query(
            mealCollectionRef, 
            where("userId", "==", userId),
            where("dietId", "==", dietId)
          )
        } else {
          q = query(mealCollectionRef, where("userId", "==", userId))
        }
        
        const querySnapshot = await getDocs(q)

        const mealsByCategory = {}
        querySnapshot.forEach((doc) => {
          const mealData = doc.data()
          const mealDate = mealData.date instanceof Date ? mealData.date : mealData.date?.toDate?.() || new Date()

          if (isEqual(startOfDay(mealDate), startOfDay(selectedDate))) {
            const category = mealData.meal
            if (!mealsByCategory[category]) {
              mealsByCategory[category] = []
            }
            mealsByCategory[category].push({ id: doc.id, ...mealData })
          }
        })
        setUserMeals(mealsByCategory)
      } catch (error) {
        console.error("Error fetching user meals:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserMeals()
    } else {
      setLoading(false)
    }
  }, [userId, selectedDate, dietId])

  // Image analysis function with pros/cons/suggestions
  const handleImageAnalysis = async (file, category, mealId, isNewMeal) => {
    setImageAnalysisModal({ isOpen: true, category, mealId, isNewMeal })
    setIsAnalyzing(true)
    setAnalysisData({})
    setFoodAnalysis(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      const base64Data = await base64Promise

      const prompt = `Analyze this food image and provide:
      1. Nutritional information (food name, quantity, calories, carbs, protein, fats)
      2. Brief pros (2-3 short points, max 10 words each)
      3. Brief cons (2-3 short points, max 10 words each)
      4. One short suggestion (max 15 words)
      
      Return as JSON with structure:
      {
        "food": "name",
        "quantity": "amount",
        "calories": number,
        "carbs": number,
        "protein": number,
        "fats": number,
        "pros": ["point1", "point2"],
        "cons": ["point1", "point2"],
        "suggestion": "brief tip"
      }`

      const result = await geminiModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        }
      ])

      const response = await result.response
      let text = response.text()

      // Extract JSON from response
      const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/
      const match = text.match(codeBlockRegex)
      if (match) {
        text = match[1]
      }

      let parsedData
      try {
        parsedData = JSON.parse(text)
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)
        toast.error("Could not analyze the image properly. Please try again or enter manually.")
        setIsAnalyzing(false)
        return
      }

      // Process the values
      const processValue = (value) => {
        if (!value) return ""
        const stringValue = typeof value === "string" ? value : String(value)
        const cleanedValue = stringValue.replace(/[^0-9.]/g, "")
        const numValue = Number.parseFloat(cleanedValue)
        return isNaN(numValue) ? "" : Math.round(numValue).toString()
      }

      setAnalysisData({
        food: parsedData.food || "",
        quantity: parsedData.quantity || "",
        calories: processValue(parsedData.calories),
        carbs: processValue(parsedData.carbs),
        protein: processValue(parsedData.protein),
        fats: processValue(parsedData.fats)
      })

      setFoodAnalysis({
        pros: parsedData.pros || [],
        cons: parsedData.cons || [],
        suggestion: parsedData.suggestion || ""
      })

      setIsAnalyzing(false)
    } catch (error) {
      console.error("Error analyzing image:", error)
      toast.error("Failed to analyze image. Please try again.")
      setIsAnalyzing(false)
      setImageAnalysisModal({ isOpen: false, category: null, mealId: null, isNewMeal: false })
    }
  }

  // Handle image file selection (both upload and capture)
  const handleImageSelect = (e, category, mealId, isNewMeal) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file")
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB")
        return
      }

      handleImageAnalysis(file, category, mealId, isNewMeal)
    }
  }

  // Handle upload option selection
  const handleUploadOption = (category, mealId, isNewMeal) => {
    const fileInputKey = isNewMeal ? `new-${category}` : `${category}-${mealId}`
    fileInputRefs.current[fileInputKey]?.click()
  }

  // Handle capture option selection
  const handleCaptureOption = (category, mealId, isNewMeal) => {
    const cameraInputKey = isNewMeal ? `camera-new-${category}` : `camera-${category}-${mealId}`
    cameraInputRefs.current[cameraInputKey]?.click()
  }

  // Handle analysis confirmation with save option
  const handleAnalysisConfirm = (saveAnalysis) => {
    const { category, mealId, isNewMeal } = imageAnalysisModal

    const mealDataToUpdate = {
      food: analysisData.food,
      quantity: analysisData.quantity,
      calories: analysisData.calories,
      carbs: analysisData.carbs,
      protein: analysisData.protein,
      fats: analysisData.fats,
    }

    // Add food analysis if user chose to save it
    if (saveAnalysis && foodAnalysis) {
      mealDataToUpdate.foodAnalysis = foodAnalysis
    }

    if (isNewMeal) {
      setNewMealData((prevState) => ({
        ...prevState,
        [category]: {
          ...prevState[category],
          ...mealDataToUpdate,
          dietId: dietId || null,
        },
      }))
    } else {
      setLocalMeals((prevState) => ({
        ...prevState,
        [mealId]: {
          ...prevState[mealId],
          ...mealDataToUpdate,
        },
      }))
    }

    setImageAnalysisModal({ isOpen: false, category: null, mealId: null, isNewMeal: false })
    setAnalysisData({})
    setFoodAnalysis(null)
    toast.success("Nutritional values updated!")
  }

  const handleAddMeal = (category) => {
    setNewMealForms((prevState) => ({ ...prevState, [category]: true }))
    setNewMealData((prevState) => ({
      ...prevState,
      [category]: {
        meal: category,
        food: "",
        quantity: "",
        fats: "",
        carbs: "",
        protein: "",
        calories: "",
        userId: userId,
        date: selectedDate,
        dietId: dietId || null,
      },
    }))
  }

  const handleCancelNewMeal = (category) => {
    setNewMealForms((prevState) => {
      const newState = { ...prevState }
      delete newState[category]
      return newState
    })
    setNewMealData((prevState) => {
      const newState = { ...prevState }
      delete newState[category]
      return newState
    })
  }

  const handleSaveNewMeal = async (category, mealData) => {
    try {
      const mealCollectionRef = collection(db, "meals")
      const mealWithDietId = { ...mealData, dietId: dietId || null }
      const docRef = await addDoc(mealCollectionRef, mealWithDietId)

      setUserMeals((prevState) => {
        const newMealList = [...(prevState[category] || []), { id: docRef.id, ...mealWithDietId }]
        return {
          ...prevState,
          [category]: newMealList,
        }
      })
      handleRefetch()
      handleCancelNewMeal(category)
    } catch (e) {
      console.error("Error adding document: ", e)
    }
  }

  const handleEditMeal = (category, mealId) => {
    setLocalMeals((prevState) => ({
      ...prevState,
      [mealId]: { ...userMeals[category].find((meal) => meal.id === mealId) },
    }))
    setEditingMeal({ category, id: mealId })
  }

  const handleCancelEdit = () => {
    setEditingMeal(null)
    setLocalMeals({})
  }

  const handleUpdateMeal = async (category, mealId, updatedMealData) => {
    try {
      const mealDocRef = doc(db, "meals", mealId)
      const updateData = { ...updatedMealData }
      if (dietId && !updateData.dietId) {
        updateData.dietId = dietId
      }
      
      await updateDoc(mealDocRef, updateData)

      setUserMeals((prevState) => {
        const updatedCategoryMeals = prevState[category].map((meal) =>
          meal.id === mealId ? { ...meal, ...updateData } : meal,
        )
        return { ...prevState, [category]: updatedCategoryMeals }
      })

      setEditingMeal(null)
      setLocalMeals({})
    } catch (error) {
      console.error("Error updating meal:", error)
    }
  }

  const handleDeleteMeal = async (category, mealId) => {
    try {
      const mealDocRef = doc(db, "meals", mealId)
      await deleteDoc(mealDocRef)

      setUserMeals((prevState) => {
        const updatedCategoryMeals = prevState[category].filter((meal) => meal.id !== mealId)
        return { ...prevState, [category]: updatedCategoryMeals }
      })

      setEditingMeal(null)
      setLocalMeals({})
    } catch (error) {
      console.error("Error deleting meal:", error)
    }
  }

  const handleGeminiSuggestion = useCallback(
    async (category, mealId, food, quantity, isNewMeal) => {
      const currentRetryCount = retryCounts[mealId] || 0
  
      if (currentRetryCount >= 2) {
        toast("Maximum retries reached. Please add manually.", { position: "top-center" })
        setGeneratingSuggestion(false)
        return
      }
  
      if (!food || !quantity) {
        toast("Please enter food name and quantity to get suggestions.", { position: "top-center" })
        return
      }
  
      setGeneratingSuggestion(true)
  
      const prompt = `Give me the estimated nutritional information (calories, carbs, protein, and fat) for ${quantity} of ${food}. Return the response as a JSON object with keys: calories, carbs, protein, fats. If you cannot find the information, return a JSON object with all values set to empty strings (""). Give clear integer value only`
  
      console.log("=== NUTRITION DEBUG ===");
      console.log("Food:", food, "Quantity:", quantity);
      console.log("Prompt:", prompt);
  
      try {
        const response = await geminiModel.generateContent(prompt)
        console.log("Gemini response received:", response);
        let text = response.response.text()
        console.log("Raw text from Gemini:", text);
  
        const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/
        const match = text.match(codeBlockRegex)
  
        if (match) {
          text = match[1]
          console.log("Extracted JSON:", text);
        }
  
        let parsedData
        try {
          parsedData = JSON.parse(text)
          console.log("Parsed nutrition data:", parsedData);
        } catch (parseError) {
          console.error("Error parsing Gemini response:", parseError, "Raw text:", text)
          
          // Try to extract without code block
          const cleanText = text.replace(/```json|```/g, '').trim();
          try {
            parsedData = JSON.parse(cleanText);
            console.log("Parsed from cleaned text:", parsedData);
          } catch (secondError) {
            console.error("Second parsing attempt failed:", secondError);
            toast("Could not understand the response from Gemini. Please try again or add manually.", {
              position: "top-center",
            })
            setGeneratingSuggestion(false)
            return
          }
        }
        
        if (parsedData && Object.keys(parsedData).length === 0 && parsedData.constructor === Object) {
          console.warn("Gemini returned an empty object, retrying")
          toast("Gemini could not find suggestions. Please add manually.", { position: "top-center" })
          setRetryCounts((prevCounts) => ({
            ...prevCounts,
            [mealId]: (prevCounts[mealId] || 0) + 1,
          }))
          return
        }
  
        const processValue = (value) => {
          if (!value) return ""
          const stringValue = typeof value === "string" ? value : String(value)
          let cleanedValue = stringValue.replace(/approximately|approx\.|depending on.*|varies greatly|about/gi, "")
          const rangeMatch = cleanedValue.match(/(\d+(\.\d+)?)/)
          if (rangeMatch) {
            cleanedValue = rangeMatch[1]
          }
          const numericValue = cleanedValue.replace(/[^0-9.]/g, "")
          const numValue = Number.parseFloat(numericValue)
          return isNaN(numValue) ? "" : Math.round(numValue).toString()
        }
  
        if (isNewMeal) {
          setNewMealData((prevState) => ({
            ...prevState,
            [category]: {
              ...prevState[category],
              calories: processValue(parsedData.calories),
              carbs: processValue(parsedData.carbs),
              protein: processValue(parsedData.protein),
              fats: processValue(parsedData.fats),
              dietId: dietId || null,
            },
          }))
        } else {
          setLocalMeals((prevState) => ({
            ...prevState,
            [mealId]: {
              ...prevState[mealId],
              calories: processValue(parsedData.calories),
              carbs: processValue(parsedData.carbs),
              protein: processValue(parsedData.protein),
              fats: processValue(parsedData.fats),
            },
          }))
        }
      } catch (error) {
        console.error("Error getting Gemini suggestion:", error)
        setRetryCounts((prevCounts) => ({
          ...prevCounts,
          [mealId]: (prevCounts[mealId] || 0) + 1,
        }))
        toast("Could not fetch suggestions. Retrying...", { position: "top-center" })
      } finally {
        setGeneratingSuggestion(false)
      }
    },
    [
      retryCounts,
      dietId,
      setGeneratingSuggestion,
      geminiModel,
      setNewMealData,
      setLocalMeals,
      setRetryCounts
    ]
  )

  const renderMealItem = (meal, category, isSuggested) => {
    const isBeingEdited = editingMeal?.category === category && editingMeal?.id === meal.id
    const localMeal = localMeals[meal.id] || meal
    const currentRetryCount = retryCounts[meal.id] || 0
    const fileInputKey = `${category}-${meal.id}`
    const cameraInputKey = `camera-${category}-${meal.id}`

    const handleInputChange = (e, field) => {
      const value = e.target.value

      setLocalMeals((prevState) => {
        const updatedMeal = { ...(prevState[meal.id] || meal), [field]: value }
        
        return {
          ...prevState,
          [meal.id]: {
            ...(prevState[meal.id] || meal),
            [field]: value,
          },
        }
      })
    }

    const handleGetSuggestion = () => {
      if (localMeal.food === "" || localMeal.quantity === "") {
        toast("Please enter food name and quantity.", { position: "top-center" })
        return
      }

      handleGeminiSuggestion(category, meal.id, localMeal.food, localMeal.quantity, false)
    }

    if (isBeingEdited) {
      return (
        <div key={meal.id} className="pt-2 border-t border-gray-100">
          <input
            type="text"
            value={localMeal.food || ""}
            placeholder="Food Name"
            onChange={(e) => handleInputChange(e, "food")}
            className="w-full px-2 py-1 mb-1 border rounded"
          />
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={localMeal.quantity || ""}
              placeholder="Quantity (e.g., 100g)"
              onChange={(e) => handleInputChange(e, "quantity")}
              className="flex-1 px-2 py-1 mb-1 border rounded"
            />

            {/* Hidden file inputs */}
            <input
              ref={(el) => (fileInputRefs.current[fileInputKey] = el)}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageSelect(e, category, meal.id, false)}
            />
            
            <input
              ref={(el) => (cameraInputRefs.current[cameraInputKey] = el)}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageSelect(e, category, meal.id, false)}
            />
            
            <Menu placement="bottom-end">
              <MenuHandler>
                <button
                  className="p-2 text-blue-500 rounded hover:bg-blue-50"
                  title="Upload or capture food image"
                >
                  <i className="text-lg text-black fa-solid fa-camera"></i>
                </button>
              </MenuHandler>
              <MenuList className="min-w-[180px]">
                <MenuItem 
                  className="flex items-center gap-3"
                  onClick={() => handleCaptureOption(category, meal.id, false)}
                >
                  <i className="text-lg fa-solid fa-camera"></i>
                  <span>Take Photo</span>
                </MenuItem>
                <MenuItem 
                  className="flex items-center gap-3"
                  onClick={() => handleUploadOption(category, meal.id, false)}
                >
                  <i className="text-lg fa-solid fa-image"></i>
                  <span>Upload Image</span>
                </MenuItem>
              </MenuList>
            </Menu>

            <button
              onClick={handleGetSuggestion}
              disabled={currentRetryCount >= 2 || generatingSuggestion}
              className={`p-2 ${currentRetryCount >= 2 || generatingSuggestion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {generatingSuggestion ? (
                <span className="text-sm">...</span>
              ) : (
                <i className="text-lg text-orange-500 fa-solid fa-hand-sparkles"></i>
              )}
            </button>
          </div>

          <input
            type="number"
            value={localMeal.calories || ""}
            placeholder="Calories"
            onChange={(e) => handleInputChange(e, "calories")}
            className="w-full px-2 py-1 mb-1 border rounded"
          />
          <div className="flex justify-between text-sm">
            <input
              type="number"
              value={localMeal.carbs || ""}
              placeholder="Carbs (g)"
              onChange={(e) => handleInputChange(e, "carbs")}
              className="w-16 px-2 py-1 border rounded"
            />
            <input
              type="number"
              value={localMeal.protein || ""}
              placeholder="Protein (g)"
              onChange={(e) => handleInputChange(e, "protein")}
              className="w-16 px-2 py-1 border rounded"
            />
            <input
              type="number"
              value={localMeal.fats || ""}
              placeholder="Fats (g)"
              onChange={(e) => handleInputChange(e, "fats")}
              className="w-16 px-2 py-1 border rounded"
            />

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 text-green-500"
              onClick={() => {handleUpdateMeal(category, meal.id, localMeal);handleRefetch()}}
            >
              <span className="text-xl">✔️</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 text-red-500"
              onClick={handleCancelEdit}
            >
              <span className="text-xl">❌</span>
            </motion.button>
          </div>
        </div>
      )
    }

    return (
      <div key={meal.id} className={`pt-2 border-t border-gray-100 p-2 ${isSuggested && "bg-gray-100 rounded-lg"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 font-medium text-gray-800">
              {meal.food}
              {meal.foodAnalysis && (
                <button
                  onClick={() => setFoodInfoModal({ isOpen: true, foodInfo: meal.foodAnalysis })}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  title="View food information"
                >
                  <i className="text-sm fa-solid fa-info-circle"></i>
                </button>
              )}
            </p>
            <p className="mb-2 text-sm text-gray-500">{meal.quantity}</p>
          </div>
        </div>
        {meal.calories && <p className="mb-2 text-sm font-semibold text-orange-500">CALORIES: {meal.calories} kcal</p>}

        <div className="flex justify-between text-sm">
          <div className="flex gap-3">
            <span className="font-semibold text-red-500">
              CARBS: {meal.carbs}
              {!isSuggested && "g"}
            </span>
            <span className="font-semibold text-blue-500">
              PROTEIN: {meal.protein}
              {!isSuggested && "g"}
            </span>
            <span className="font-semibold text-amber-500">
              FAT: {meal.fats}
              {!isSuggested && "g"}
            </span>
          </div>
          {!isSuggested && (
            <div className="flex gap-3">
              <span onClick={() => handleEditMeal(category, meal.id)} className="text-xl cursor-pointer">
                ✍️
              </span>
              <span onClick={() => handleDeleteMeal(category, meal.id)} className="text-xl cursor-pointer">
                🗑️
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderNewMealForm = (category, mealData, setMealData) => {
    const mealId = category
    const currentRetryCount = retryCounts[mealId] || 0
    const fileInputKey = `new-${category}`
    const cameraInputKey = `camera-new-${category}`
    
    const handleInputChange = (e, field) => {
      setMealData((prevState) => ({
        ...prevState,
        [category]: {
          ...prevState[category],
          [field]: e.target.value,
        },
      }))
    }

    const handleGetSuggestion = () => {
      if (mealData[category]?.food === "" || mealData[category]?.quantity === "") {
        toast("Please enter food name and quantity.", { position: "top-center" })
        return
      }

      handleGeminiSuggestion(category, mealId, mealData[category]?.food, mealData[category]?.quantity, true)
    }

    return (
      <div className="pt-2 border-t border-gray-100">
        <input
          type="text"
          placeholder="Food Name"
          value={mealData[category]?.food || ""}
          onChange={(e) => handleInputChange(e, "food")}
          className="w-full px-2 py-1 mb-1 border rounded"
        />
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            placeholder="Quantity (e.g., 100g)"
            value={mealData[category]?.quantity || ""}
            onChange={(e) => handleInputChange(e, "quantity")}
            className="flex-1 w-full px-2 py-1 mb-1 border rounded"
          />

          {/* Hidden file inputs */}
          <input
            ref={(el) => (fileInputRefs.current[fileInputKey] = el)}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e, category, mealId, true)}
          />
          
          <input
            ref={(el) => (cameraInputRefs.current[cameraInputKey] = el)}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleImageSelect(e, category, mealId, true)}
          />
          
          <Menu placement="bottom-end">
            <MenuHandler>
              <button
                className="p-2 text-blue-500 rounded hover:bg-blue-50"
                title="Upload or capture food image"
              >
                <i className="text-lg text-black fa-solid fa-camera"></i>
              </button>
            </MenuHandler>
            <MenuList className="min-w-[180px]">
              <MenuItem 
                className="flex items-center gap-3"
                onClick={() => handleCaptureOption(category, mealId, true)}
              >
                <i className="text-lg fa-solid fa-camera"></i>
                <span>Take Photo</span>
              </MenuItem>
              <MenuItem 
                className="flex items-center gap-3"
                onClick={() => handleUploadOption(category, mealId, true)}
              >
                <i className="text-lg fa-solid fa-image"></i>
                <span>Upload Image</span>
              </MenuItem>
            </MenuList>
          </Menu>

          <button
            onClick={handleGetSuggestion}
            disabled={currentRetryCount >= 2 || generatingSuggestion}
            className={`p-2 ${currentRetryCount >= 2 || generatingSuggestion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {generatingSuggestion ? (
              <span className="text-sm">...</span>
            ) : (
              <i className="text-lg text-orange-500 fa-duotone fa-solid fa-microchip-ai"></i>
            )}
          </button>
        </div>
        <input
          type="number"
          placeholder="Calories"
          value={mealData[category]?.calories || ""}
          onChange={(e) => handleInputChange(e, "calories")}
          className="w-full px-2 py-1 mb-1 border rounded"
        />
        <div className="flex justify-between text-sm">
          <input
            type="number"
            placeholder="Carbs (g)"
            value={mealData[category]?.carbs || ""}
            onChange={(e) => handleInputChange(e, "carbs")}
            className="w-16 px-2 py-1 border rounded"
          />
          <input
            type="number"
            placeholder="Protein (g)"
            value={mealData[category]?.protein || ""}
            onChange={(e) => handleInputChange(e, "protein")}
            className="w-16 px-2 py-1 border rounded"
          />
          <input
            type="number"
            placeholder="Fats (g)"
            value={mealData[category]?.fats || ""}
            onChange={(e) => handleInputChange(e, "fats")}
            className="w-16 px-2 py-1 border rounded"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-green-500"
            onClick={() => {handleSaveNewMeal(category, mealData[category]);handleRefetch()}}
          >
            <span className="text-xl">✔️</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-red-500"
            onClick={() => handleCancelNewMeal(category)}
          >
            <span className="text-xl">❌</span>
          </motion.button>
        </div>
      </div>
    )
  }

  const filteredDietList =
    dietList?.filter((meal) => {
      if (!meal.date) return false
      const mealDate = meal.date instanceof Date ? meal.date : meal.date?.toDate?.() || new Date()
      const dateMatches = isEqual(startOfDay(mealDate), startOfDay(selectedDate))
      const dietIdMatches = dietId ? meal.dietId === dietId : true
      
      return dateMatches && dietIdMatches
    }) || []

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <ImageAnalysisModal
        isOpen={imageAnalysisModal.isOpen}
        onClose={() => setImageAnalysisModal({ isOpen: false, category: null, mealId: null, isNewMeal: false })}
        onConfirm={handleAnalysisConfirm}
        analysisData={analysisData}
        setAnalysisData={setAnalysisData}
        isAnalyzing={isAnalyzing}
        foodAnalysis={foodAnalysis}
        setFoodAnalysis={setFoodAnalysis}
      />
      
      <FoodInfoModal
        isOpen={foodInfoModal.isOpen}
        onClose={() => setFoodInfoModal({ isOpen: false, foodInfo: null })}
        foodInfo={foodInfoModal.foodInfo}
      />
      
      <div className="pb-20 space-y-3 overflow-y-auto">
        <div className="p-2 text-center rounded-lg bg-tprimary">
          <h3 className="font-medium text-white">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
        </div>
        {mealCategories?.map((category, index) => {
          const suggestedMeals = dietId
            ? dietList?.filter((meal) => meal.meal === category && (!meal.dietId || meal.dietId === dietId))
            : dietList?.filter((meal) => meal.meal === category)
            
          const userAddedMeals = userMeals[category] || []
          
          // Filter out suggested meals that are already added by user to avoid duplication
          const filteredSuggestedMeals = suggestedMeals?.filter(suggestedMeal => 
            !userAddedMeals.some(userMeal => 
              userMeal.food === suggestedMeal.food && 
              userMeal.quantity === suggestedMeal.quantity
            )
          ) || []

          return (
            <Accordion
              key={category}
              open={openAccordion === index + 1}
              className="overflow-hidden bg-white border border-blue-100 rounded-lg"
            >
              <AccordionHeader onClick={() => handleOpenAccordion(index + 1)} className="p-2 text-gray-800 border-b-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {category === "Breakfast" && <span className="text-xl text-orange-500">🍳</span>}
                    {category === "Lunch" && <span className="text-xl text-green-500">🍲</span>}
                    {category === "Snack" && <span className="text-xl text-purple-500">🥪</span>}
                    {category === "Dinner" && <span className="text-xl text-blue-500">🍽️</span>}
                    {category === "Exercise" && <span className="text-xl text-red-500">🏋️‍♀️</span>}
                    <span className="font-medium">{category}</span>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionBody className="p-2 pt-0">
                {filteredSuggestedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, true))}
                {userAddedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, false))}
                {newMealForms[category] && renderNewMealForm(category, newMealData, setNewMealData)}

                {!newMealForms[category] && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 mt-2 text-green-500"
                    onClick={() => handleAddMeal(category)}
                  >
                    <span className="text-xl">+</span>
                    <span className="text-sm">Add Meal</span>
                  </motion.button>
                )}

                {filteredSuggestedMeals.length === 0 && userAddedMeals.length === 0 && !newMealForms[category] && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="mb-1 font-medium text-gray-800">No meals planned for {category}</p>
                  </div>
                )}
              </AccordionBody>
            </Accordion>
          )
        })}
      </div>
    </>
  )
}

export default PlannedMeal