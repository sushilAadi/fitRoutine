"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Accordion, AccordionHeader, AccordionBody } from "@material-tailwind/react"
import { motion } from "framer-motion"

import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { format, isEqual, startOfDay } from "date-fns"
import { db, geminiModel } from "@/firebase/firebaseConfig"
import toast from "react-hot-toast" // Import react-hot-toast

const PlannedMeal = ({ dietList, openAccordion, handleOpenAccordion, userId, selectedDate }) => {
  const mealCategories = ["Breakfast", "Lunch", "Snack", "Exercise", "Dinner"]
  const [userMeals, setUserMeals] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingMeal, setEditingMeal] = useState(null)
  const [newMealForms, setNewMealForms] = useState({})
  const [newMealData, setNewMealData] = useState({})
  const [localMeals, setLocalMeals] = useState({})
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false)
  const [retryCounts, setRetryCounts] = useState({}) // Track retry counts per meal item

  const inputRefs = useRef({})

  useEffect(() => {
    const fetchUserMeals = async () => {
      setLoading(true)
      try {
        const mealCollectionRef = collection(db, "meals")
        const q = query(mealCollectionRef, where("userId", "==", userId))
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
  }, [userId, selectedDate])

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
      const docRef = await addDoc(mealCollectionRef, mealData)

      setUserMeals((prevState) => {
        const newMealList = [...(prevState[category] || []), { id: docRef.id, ...mealData }]
        return {
          ...prevState,
          [category]: newMealList,
        }
      })
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
      await updateDoc(mealDocRef, updatedMealData)

      setUserMeals((prevState) => {
        const updatedCategoryMeals = prevState[category].map((meal) =>
          meal.id === mealId ? { ...meal, ...updatedMealData } : meal,
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
      // Check retry count
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
  
      try {
        const response = await geminiModel.generateContent(prompt)
        let text = response.response.text()
  
        const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/
        const match = text.match(codeBlockRegex)
  
        if (match) {
          text = match[1]
        }
  
        let parsedData
        try {
          parsedData = JSON.parse(text)
        } catch (parseError) {
          console.error("Error parsing Gemini response:", parseError, "Raw text:", text)
          toast("Could not understand the response from Gemini. Please try again or add manually.", {
            position: "top-center",
          })
          return
        }
        console.log("parsedData", parsedData)
        if (parsedData && Object.keys(parsedData).length === 0 && parsedData.constructor === Object) {
          console.warn("Gemini returned an empty object, retrying") // log the empty response
          toast("Gemini could not find suggestions. Please add manually.", { position: "top-center" })
          // Increment retry count
          setRetryCounts((prevCounts) => ({
            ...prevCounts,
            [mealId]: (prevCounts[mealId] || 0) + 1,
          }))
          return
        }
  
        const processValue = (value) => {
          if (!value) return ""
          // Ensure value is a string
          const stringValue = typeof value === "string" ? value : String(value)
  
          // 1. Clean the text
          let cleanedValue = stringValue.replace(/approximately|approx\.|depending on.*|varies greatly|about/gi, "")
  
          // 2. Extract the first number from a range (e.g., "200-400" becomes "200")
          const rangeMatch = cleanedValue.match(/(\d+(\.\d+)?)/) // Match a number with optional decimal
          if (rangeMatch) {
            cleanedValue = rangeMatch[1] // Take the first matched number
          }
  
          // 3. Remove all non-numeric characters except the decimal point
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
        // Increment retry count
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
      toast,
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

    const handleInputChange = (e, field) => {
      const value = e.target.value

      setLocalMeals((prevState) => {
        const updatedMeal = { ...(prevState[meal.id] || meal), [field]: value }
        console.log(`Setting localMeal[${meal.id}]`, updatedMeal) // Debug log
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
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={localMeal.quantity || ""}
              placeholder="Quantity (e.g., 100g)"
              onChange={(e) => handleInputChange(e, "quantity")}
              className="px-2 py-1 mb-1 border rounded "
            />

            <button
              onClick={handleGetSuggestion}
              disabled={currentRetryCount >= 2 || generatingSuggestion}
              className={`bg-transparent border-none p-0 ${currentRetryCount >= 2 || generatingSuggestion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {generatingSuggestion ? (
                <span>Generating...</span>
              ) : (
                <i className="text-xl text-orange-500 fa-solid fa-hand-sparkles"></i>
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
              onClick={() => handleUpdateMeal(category, meal.id, localMeal)}
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
        <p className="mb-1 font-medium text-gray-800">{meal.food}</p>
        <p className="mb-2 text-sm text-gray-500">{meal.quantity}</p>
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
    const mealId = category // Use the category as a unique key for new meal forms
    const currentRetryCount = retryCounts[mealId] || 0
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
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Quantity (e.g., 100g)"
            value={mealData[category]?.quantity || ""}
            onChange={(e) => handleInputChange(e, "quantity")}
            className="w-full px-2 py-1 mb-1 border rounded"
          />

          <button
            onClick={handleGetSuggestion}
            disabled={currentRetryCount >= 2 || generatingSuggestion}
            className={`bg-transparent border-none p-0 ${currentRetryCount >= 2 || generatingSuggestion ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {generatingSuggestion ? (
              <span>Generating...</span>
            ) : (
              <i className="text-xl text-orange-500 fa-solid fa-hand-sparkles"></i>
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
            onClick={() => handleSaveNewMeal(category, mealData[category])}
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

  // Filter dietList suggestions based on the selected date
  const filteredDietList =
    dietList?.filter((meal) => {
      // Assuming dietList has a date field. If not, you might need to adjust this logic
      if (!meal.date) return false

      const mealDate = meal.date instanceof Date ? meal.date : meal.date?.toDate?.() || new Date()

      return isEqual(startOfDay(mealDate), startOfDay(selectedDate))
    }) || []

  if (loading) {
    return <div>Loading...</div> // Or a better loading indicator
  }

  return (
    <div className="pb-20 space-y-3 overflow-y-auto">
      {/*  <ToastContainer /> you don't need ToastContainer with react-hot-toast*/}
      <div className="p-2 text-center rounded-lg bg-tprimary">
        <h3 className="font-medium text-white">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
      </div>
      {mealCategories?.map((category, index) => {
        const suggestedMeals = dietList?.filter((meal) => meal.meal === category)
        const userAddedMeals = userMeals[category] || [] // Use || [] to avoid undefined errors

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
              {/* Suggested Meals */}
              {suggestedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, true))}

              {/* User-Added Meals */}
              {userAddedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, false))}

              {/* New Meal Form */}
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

              {suggestedMeals.length === 0 && userAddedMeals.length === 0 && !newMealForms[category] && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="mb-1 font-medium text-gray-800">No meals planned for {category}</p>
                </div>
              )}
            </AccordionBody>
          </Accordion>
        )
      })}
    </div>
  )
}

export default PlannedMeal

