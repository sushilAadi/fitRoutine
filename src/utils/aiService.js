import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

const generateWorkoutPlan = async (userInput, exerciseList, isFitnessRelated) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt;
    if (!isFitnessRelated) {
      prompt = `The user input is not related to fitness or workout. Tell the user that they must provide fitness-related information (e.g., fitness level, goals, preferences) to generate a plan. Do not generate plan`;
    } else {
      prompt = `Generate a workout plan and diet plan based on the following information: ${userInput}.
      
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
  "workoutPlan": [
    {
      "Day": 1,
      "targetMuscle": "targetMuscle",
      "Workout": [
        {
          "Exercise": "Exercise Name (ID: exerciseId)",
          "Sets": 3,
          "Reps": "8-12"
        }
      ]
    }
  ],
  "dietPlan": [
    {
      "meal": "Breakfast",
      "food": "Oats",
      "quantity": "100g",
      "protein": "13g",
      "carbs": "67g",
      "fats": "7g"
    }
  ]
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
- Include at least 4 meals (Breakfast, Lunch, Snack, Dinner)

After the JSON, display the plans in markdown table format for better readability:

Workout Plan:
| Day | Exercise | Sets | Reps |
|-----|----------|------|------|
| 1   | Exercise Name (ID: exerciseId) | 3 | 8-12 |

Diet Plan:
| Meal | Food | Quantity | Protein | Carbs | Fats |
|------|------|----------|---------|--------|------|
| Breakfast | Oats | 100g | 13g | 67g | 7g |`;
    }

    const result = await model.generateContent(prompt);
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
    throw new Error("Failed to generate workout plan. Please check your API key and input.");
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