import React, { useState, useEffect } from 'react';
import {
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import { motion } from "framer-motion";
import { db } from '../../firebase/firebaseConfig'; // Adjust path as needed
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format, isEqual, startOfDay } from 'date-fns';

const PlannedMeal = ({ dietList, openAccordion, handleOpenAccordion, userId, selectedDate }) => {
    const mealCategories = ["Breakfast", "Lunch", "Snack","Exercise", "Dinner" ];
    const [userMeals, setUserMeals] = useState({}); // Store user-added meals, keyed by category
    const [loading, setLoading] = useState(true);
    const [editingMeal, setEditingMeal] = useState(null); // { category: '...', id: '...' }
    const [newMealForms, setNewMealForms] = useState({}); // Track which categories have active new meal forms
    const [newMealData, setNewMealData] = useState({}); // Store data for new meals, keyed by category

    useEffect(() => {
        const fetchUserMeals = async () => {
            setLoading(true);
            try {
                const mealCollectionRef = collection(db, "meals");
                const q = query(mealCollectionRef, where("userId", "==", userId));
                const querySnapshot = await getDocs(q);

                const mealsByCategory = {};
                querySnapshot.forEach((doc) => {
                    const mealData = doc.data();
                    
                    // Convert Firestore timestamp to JS Date if necessary
                    const mealDate = mealData.date instanceof Date 
                        ? mealData.date 
                        : mealData.date?.toDate?.() || new Date();
                    
                    // Check if the meal date matches the selected date
                    if (isEqual(startOfDay(mealDate), startOfDay(selectedDate))) {
                        const category = mealData.meal;  // Use 'meal' field
                        if (!mealsByCategory[category]) {
                            mealsByCategory[category] = [];
                        }
                        mealsByCategory[category].push({ id: doc.id, ...mealData });
                    }
                });
                setUserMeals(mealsByCategory);
            } catch (error) {
                console.error("Error fetching user meals:", error);
                // Handle error (e.g., display an error message)
            } finally {
                setLoading(false);
            }
        };

        if (userId) { // Only fetch if userId is available
            fetchUserMeals();
        } else {
            setLoading(false);  // Set loading to false if no userId to avoid infinite loading
        }

    }, [userId, selectedDate]); // Re-fetch when selectedDate changes

    const handleAddMeal = (category) => {
        // Open the new meal form for the specified category
        setNewMealForms(prevState => ({ ...prevState, [category]: true }));
        // Initialize new meal data for the category
        setNewMealData(prevState => ({
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
                date: selectedDate, // Use the selected date for new meals
            },
        }));
    };

    const handleCancelNewMeal = (category) => {
        // Close the new meal form
        setNewMealForms(prevState => {
            const newState = { ...prevState };
            delete newState[category];
            return newState;
        });
    };

    const handleSaveNewMeal = async (category, mealData) => {  // Pass the mealData
        try {
            const mealCollectionRef = collection(db, "meals");
            const docRef = await addDoc(mealCollectionRef, mealData); // Use the passed mealData
            

            setUserMeals((prevState) => {
                const newMealList = [
                    ...(prevState[category] || []),
                    { id: docRef.id, ...mealData },
                ];
                return {
                    ...prevState,
                    [category]: newMealList,
                };
            });
            // Clear the new meal form after saving
            handleCancelNewMeal(category);
        } catch (e) {
            console.error("Error adding document: ", e);
            // Handle error (e.g., display an error message)
        }
    };

    const handleEditMeal = (category, mealId) => {
        setEditingMeal({ category, id: mealId });
    };

    const handleCancelEdit = () => {
        setEditingMeal(null);
    };

    const handleUpdateMeal = async (category, mealId, updatedMealData) => {
        try {
            const mealDocRef = doc(db, "meals", mealId);
            await updateDoc(mealDocRef, updatedMealData);

            // Optimistically update the state
            setUserMeals(prevState => {
                const updatedCategoryMeals = prevState[category].map(meal =>
                    meal.id === mealId ? { ...meal, ...updatedMealData } : meal
                );
                return { ...prevState, [category]: updatedCategoryMeals };
            });

            setEditingMeal(null); // Clear editing state
        } catch (error) {
            console.error("Error updating meal:", error);
            // Handle error (e.g., display an error message)
        }
    };

    const handleDeleteMeal = async (category, mealId) => {
        try {
            const mealDocRef = doc(db, "meals", mealId);
            await deleteDoc(mealDocRef);

            // Optimistically update the state
            setUserMeals(prevState => {
                const updatedCategoryMeals = prevState[category].filter(meal => meal.id !== mealId);
                return { ...prevState, [category]: updatedCategoryMeals };
            });

            setEditingMeal(null); // Clear editing state, in case we were editing the meal
        } catch (error) {
            console.error("Error deleting meal:", error);
            // Handle error (e.g., display an error message)
        }
    };

    const renderMealItem = (meal, category, isSuggested) => {
        const isBeingEdited = editingMeal?.category === category && editingMeal?.id === meal.id;

        const handleInputChange = (e, field) => {
            const updatedMealData = { ...meal, [field]: e.target.value };
            setUserMeals(prevState => {
                const updatedCategoryMeals = prevState[category].map(m =>
                    m.id === meal.id ? { ...m, [field]: e.target.value } : m
                );
                return { ...prevState, [category]: updatedCategoryMeals };
            });
        };

        if (isBeingEdited) {
            return (
                <div key={meal.id+Math.random()} className="pt-2 border-t border-gray-100">
                    <input
                        type="text"
                        value={meal.food}
                        placeholder="Food Name"
                        onChange={(e) => handleInputChange(e, 'food')}
                        className="w-full px-2 py-1 mb-1 border rounded"
                    />
                    <input
                        type="text"
                        value={meal.quantity}
                        placeholder="Quantity (e.g., 100g)"
                        onChange={(e) => handleInputChange(e, 'quantity')}
                        className="w-full px-2 py-1 mb-1 border rounded"
                    />
                    <input
                        type="text"
                        value={meal.calories}
                        placeholder="Calories"
                        onChange={(e) => handleInputChange(e, 'calories')}
                        className="w-full px-2 py-1 mb-1 border rounded"
                    />
                    <div className="flex justify-between text-sm">
                        <input
                            type="text"
                            value={meal.carbs}
                            placeholder="Carbs (g)"
                            onChange={(e) => handleInputChange(e, 'carbs')}
                            className="w-16 px-2 py-1 border rounded"
                        />
                        <input
                            type="text"
                            value={meal.protein}
                            placeholder="Protein (g)"
                            onChange={(e) => handleInputChange(e, 'protein')}
                            className="w-16 px-2 py-1 border rounded"
                        />
                        <input
                            type="text"
                            value={meal.fats}
                            placeholder="Fats (g)"
                            onChange={(e) => handleInputChange(e, 'fats')}
                            className="w-16 px-2 py-1 border rounded"
                        />

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 text-green-500"
                            onClick={() => handleUpdateMeal(category, meal.id, meal)}  // Save updated data
                        >
                            <span className="text-xl">✔️</span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 text-red-500"
                            onClick={handleCancelEdit}  // Cancel editing
                        >
                            <span className="text-xl">❌</span>
                        </motion.button>
                    </div>
                </div>
            );
        }

        return (
            <div key={meal.id} className="pt-2 border-t border-gray-100">
                <p className="mb-1 font-medium text-gray-800">{meal.food}</p>
                <p className="mb-2 text-sm text-gray-500">{meal.quantity}</p>
                {meal.calories && <p className="mb-2 text-sm font-semibold text-orange-500">CALORIES: {meal.calories} kcal</p>}

                <div className="flex justify-between text-sm">
                    <div className="flex gap-3">
                        <span className="font-semibold text-red-500">CARBS: {meal.carbs}{!isSuggested && "g"}</span>
                        <span className="font-semibold text-blue-500">PROTEIN: {meal.protein}{!isSuggested && "g"}</span>
                        <span className="font-semibold text-amber-500">FAT: {meal.fats}{!isSuggested && "g"}</span>
                    </div>
                    {!isSuggested && (
                        <div className='flex gap-3'>
                            <span onClick={() => handleEditMeal(category, meal.id)} className="text-xl cursor-pointer">✍️</span>
                            <span onClick={() => handleDeleteMeal(category, meal.id)} className="text-xl cursor-pointer">🗑️</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderNewMealForm = (category, mealData, setMealData, onSave, onCancel) => {  // Props passed
        const handleInputChange = (e, field) => {
            setMealData(prevState => ({
                ...prevState,
                [category]: {
                    ...prevState[category],
                    [field]: e.target.value,
                },
            }));
        };

        return (
            <div className="pt-2 border-t border-gray-100">
                <input
                    type="text"
                    placeholder="Food Name"
                    value={mealData[category]?.food || ""}  // Use mealData
                    onChange={(e) => handleInputChange(e, 'food')}
                    className="w-full px-2 py-1 mb-1 border rounded"
                />
                <input
                    type="text"
                    placeholder="Quantity (e.g., 100g)"
                    value={mealData[category]?.quantity || ""} // Use mealData
                    onChange={(e) => handleInputChange(e, 'quantity')}
                    className="w-full px-2 py-1 mb-1 border rounded"
                />
                 <input
                    type="number"
                    placeholder="Calories"
                    value={mealData[category]?.calories || ""}  // Use mealData
                    onChange={(e) => handleInputChange(e, 'calories')}
                    className="w-full px-2 py-1 mb-1 border rounded"
                />
                <div className="flex justify-between text-sm">
                    <input
                        type="number"
                        placeholder="Carbs (g)"
                        value={mealData[category]?.carbs || ""}  // Use mealData
                        onChange={(e) => handleInputChange(e, 'carbs')}
                        className="w-16 px-2 py-1 border rounded"
                    />
                    <input
                        type="number"
                        placeholder="Protein (g)"
                        value={mealData[category]?.protein || ""}  // Use mealData
                        onChange={(e) => handleInputChange(e, 'protein')}
                        className="w-16 px-2 py-1 border rounded"
                    />
                    <input
                        type="number"
                        placeholder="Fats (g)"
                        value={mealData[category]?.fats || ""}  // Use mealData
                        onChange={(e) => handleInputChange(e, 'fats')}
                        className="w-16 px-2 py-1 border rounded"
                    />

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 text-green-500"
                        onClick={() => onSave(category, mealData[category])}  // Use passed onSave
                    >
                        <span className="text-xl">✔️</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 text-red-500"
                        onClick={onCancel}  // Use passed onCancel
                    >
                        <span className="text-xl">❌</span>
                    </motion.button>
                </div>
            </div>
        );
    };

    // Filter dietList suggestions based on the selected date
    const filteredDietList = dietList?.filter(meal => {
        // Assuming dietList has a date field. If not, you might need to adjust this logic
        if (!meal.date) return false;
        
        const mealDate = meal.date instanceof Date 
            ? meal.date 
            : meal.date?.toDate?.() || new Date();
            
        return isEqual(startOfDay(mealDate), startOfDay(selectedDate));
    }) || [];

    if (loading) {
        return <div>Loading...</div>; // Or a better loading indicator
    }
    

    return (
        <div className="pb-20 space-y-3 overflow-y-auto">
            <div className="p-2 text-center rounded-lg bg-tprimary">
                <h3 className="font-medium text-white">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
            </div>
            {mealCategories?.map((category, index) => {
                const suggestedMeals = dietList?.filter(meal => meal.meal === category);
                const userAddedMeals = userMeals[category] || [];  // Use || [] to avoid undefined errors

                {/* const totalCalories = (suggestedMeals?.reduce((sum, meal) => sum + Number(meal.calories || 0), 0) || 0) +  // Add suggested calories */}
                const totalCalories =     (userAddedMeals?.reduce((sum, meal) => sum + Number(meal.calories || 0), 0) || 0);       // add user entered calories
console.log("userAddedMeals",userAddedMeals)
                return (
                    <Accordion
                        key={category}
                        open={openAccordion === index + 1}
                        className="overflow-hidden bg-white border border-blue-100 rounded-lg"
                    >
                        <AccordionHeader
                            onClick={() => handleOpenAccordion(index + 1)}
                            className="px-4 py-2 text-gray-800 border-b-0"
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {category === "Breakfast" && (
                                        <span className="text-xl text-orange-500">🍳</span>
                                    )}
                                    {category === "Lunch" && (
                                        <span className="text-xl text-green-500">🍲</span>
                                    )}
                                    {category === "Snack" && (
                                        <span className="text-xl text-purple-500">🥪</span>
                                    )}
                                    {category === "Dinner" && (
                                        <span className="text-xl text-blue-500">🍽️</span>
                                    )}
                                    {category === "Exercise" && (
                                        <span className="text-xl text-red-500">🏋️‍♀️</span>
                                    )}
                                    <span className="font-medium">{category}</span>
                                </div>
                                
                            </div>
                        </AccordionHeader>
                        <AccordionBody className="px-4 py-2 pt-0">
                            {/* Suggested Meals */}
                            {suggestedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, true))}

                            {/* User-Added Meals */}
                            {userAddedMeals?.map((meal, mealIndex) => renderMealItem(meal, category, false))}

                            {/* New Meal Form */}
                            {newMealForms[category] && renderNewMealForm(
                                category,
                                newMealData,
                                setNewMealData,
                                handleSaveNewMeal,
                                () => handleCancelNewMeal(category)
                            )}

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


                            {(suggestedMeals.length === 0 && userAddedMeals.length === 0) && !newMealForms[category] &&(
                                <div className="pt-2 border-t border-gray-100">
                                    <p className="mb-1 font-medium text-gray-800">No meals planned for {category}</p>
                                </div>
                            )}
                        </AccordionBody>
                    </Accordion>
                );
            })}
        </div>
    );
};

export default PlannedMeal;