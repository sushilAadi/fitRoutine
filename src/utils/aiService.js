import { geminiModel } from "@/firebase/firebaseConfig";

const generateWorkoutPlan = async (userInput, exerciseList, isFitnessRelated) => {
  try {
    let prompt;
    if (!isFitnessRelated) {
      prompt = `The user input is not related to fitness or workout. Tell the user that they must provide fitness-related information (e.g., fitness level, goals, preferences) to generate a plan. Do not generate plan`;
    } else {
      prompt = `Generate a workout and diet plan based on the following information, and specify how many weeks each exercise routine should be followed to achieve the goal (e.g., 2 months, 4 months, etc.) : ${userInput}.
      
Here is the list of available exercises:
${JSON.stringify(exerciseList)}

IMPORTANT: Follow these formatting instructions exactly to ensure valid JSON output.

First, provide a workout plan summary in this format:

Workout Plan Summary:
- Fitness Level: [level]
- Days per Week: [number]
- Duration: [time] minutes per session

Then, provide the workout plan in this exact JSON format and mention which muscle it will target in days:

{
  "Totalweeks": [number],
  "workoutPlan": [
    {
      "Day": 1,
      "targetMuscle": "targetMuscle",
      "Workout": [
        {
          "id": "exerciseId",
          "Exercise": "Exercise Name",
          "Sets": 3,
          "Reps": "8-12"
        }
      ]
    }
  ],
  "dietPlan": [
    {
      "meal": "Breakfast",
      "food": "Oats, Banana, Almonds",
      "quantity": "100g oats, 1 medium banana, 20g almonds",
      "protein": "20",
      "carbs": "85",
      "fats": "15",
      "fiber": "12"
    },
    {
      "meal": "Lunch", 
      "food": "Brown Rice, Dal, Mixed Vegetables",
      "quantity": "150g rice, 100g dal, 100g vegetables",
      "protein": "25",
      "carbs": "120",
      "fats": "8",
      "fiber": "15"
    },
    {
      "meal": "Snack",
      "food": "Greek Yogurt, Berries",
      "quantity": "200g yogurt, 50g berries",
      "protein": "18",
      "carbs": "20",
      "fats": "6",
      "fiber": "4"
    },
    {
      "meal": "Dinner",
      "food": "Grilled Chicken, Quinoa, Broccoli",
      "quantity": "150g chicken, 100g quinoa, 100g broccoli",
      "protein": "35",
      "carbs": "40",
      "fats": "12",
      "fiber": "8"
    }
  ],
   "totalCaloriesRequired": "2500kcal"
}

Rules for the workout plan:
- Use ONLY exercises from the provided list
- ALWAYS include the exercise ID in parentheses after each exercise name
- Match exercise names EXACTLY as they appear in the list
- Create a balanced plan targeting different body parts
- Consider the user's fitness level and preferences
- Include appropriate sets and reps based on fitness level

Rules for the diet plan:
- Focus on Indian diet options
- Include all macronutrients (protein, carbs, fats)
- Provide specific quantities
- Include EXACTLY 4 meals (Breakfast, Lunch, Snack, Dinner)
- IMPORTANT: Create ONE entry per meal type only - combine all foods for each meal into a single entry
- If multiple foods are needed for a meal, list them separated by commas in the "food" field
- Sum up the total nutrients for all foods in that meal
- DO NOT create multiple entries for the same meal type (e.g., don't create 4 separate Breakfast entries)
- Each meal type (Breakfast, Lunch, Snack, Dinner) should appear exactly once in the dietPlan array

After the JSON, display the plans in markdown table format for better readability:

Workout Plan:
| Day | Exercise | Sets | Reps |
|-----|----------|------|------|
| 1   | Exercise Name (ID: exerciseId) | 3 | 8-12 |

Diet Plan:
| Meal | Food | Quantity | Protein | Carbs | Fats |
|------|------|----------|---------|--------|------|
| Breakfast | Oats, Banana, Almonds | 100g oats, 1 medium banana, 20g almonds | 20g | 85g | 15g |
| Lunch | Brown Rice, Dal, Mixed Vegetables | 150g rice, 100g dal, 100g vegetables | 25g | 120g | 8g |`;
    }

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract and validate JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*"workoutPlan"[\s\S]*"dietPlan"[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        // Validate the structure
        if (!jsonData.workoutPlan || !jsonData.dietPlan) {
          throw new Error("Invalid JSON structure");
        }
      }
    } catch (jsonError) {
      console.error("JSON validation error:", jsonError);
      // The original text will still be returned even if JSON validation fails
    }
    
    return text;
  } catch (error) {
    console.error("Error generating workout plan:", error);
    
    // Enhanced error handling for common issues
    if (error.message?.includes('API_KEY')) {
      throw new Error("Invalid API key. Please check your NEXT_PUBLIC_GOOGLE_API_KEY environment variable.");
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error("API rate limit exceeded. Please try again in a few minutes.");
    } else if (error.message?.includes('billing')) {
      throw new Error("Billing issue detected. Make sure you're using the free Google AI Studio API, not Vertex AI.");
    } else {
      throw new Error("Failed to generate workout plan. Please try again.");
    }
  }
};

// Helper function to extract JSON data from the response
const extractPlansFromResponse = (response) => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*"workoutPlan"[\s\S]*"dietPlan"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  } catch (error) {
    console.error("Error extracting plans:", error);
    return null;
  }
};

export { generateWorkoutPlan, extractPlansFromResponse };