import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

console.log("apiKey", apiKey);

async function generateWorkoutPlan(userInput, isFitnessRelated) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt;
    if (!isFitnessRelated) {
      prompt = `The user input is not related to fitness or workout. Tell the user that they must provide fitness-related information (e.g., fitness level, goals, preferences) to generate a plan. Do not generate plan`;
    } else {
      prompt = `Generate a workout plan and diet plan based on the following information: ${userInput}.

Workout plan should be a table with columns: Day, Exercise, Sets, Reps. Return the table in markdown format.

Diet plan should be a table with columns: Meal, Food, Quantity. as per Indian diet. Return the table in markdown format.`;
    }

    console.log("prompt", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw new Error(
      "Failed to generate workout plan.  Please check your API key and input."
    );
  }
}


export { generateWorkoutPlan };