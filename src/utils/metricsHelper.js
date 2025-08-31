import { doc, setDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

/**
 * Insert user metrics (weight, height, etc.) into unified collection
 * @param {string} userId - User ID 
 * @param {Object} metrics - Metrics object containing weight, height, etc.
 * @param {string} type - Type of entry ('initial_setup', 'update', 'manual_entry')
 * @param {string} source - Source of data ('onboarding', 'profile_edit', 'daily_log')
 */
export const insertUserMetrics = async (userId, metrics, type = 'update', source = 'manual_entry') => {
    try {
        const currentTimestamp = new Date().toISOString();
        const metricsId = `${userId}_${Date.now()}`; // Unique ID for this metrics entry
        
        const metricsData = {
            userIdCl: userId,
            timestamp: currentTimestamp,
            type: type,
            source: source,
            ...metrics // Spread metrics (weight, height, body_fat, etc.)
        };

        // Create document in user_metrics collection with unique ID
        const metricsDocRef = doc(db, "user_metrics", metricsId);
        await setDoc(metricsDocRef, metricsData);

        // Update latest metrics in users collection for quick access
        const latestMetrics = {};
        if (metrics.weight) latestMetrics.latestWeight = metrics.weight;
        if (metrics.height) latestMetrics.latestHeight = metrics.height;
        if (metrics.body_fat) latestMetrics.latestBodyFat = metrics.body_fat;
        
        if (Object.keys(latestMetrics).length > 0) {
            const userDocRef = doc(db, "users", userId);
            await setDoc(userDocRef, {
                ...latestMetrics,
                lastMetricsUpdate: currentTimestamp
            }, { merge: true });
        }

        return { success: true, metricsId };
    } catch (error) {
        console.error("Error while inserting user metrics:", error);
        return { success: false, error };
    }
};

/**
 * Get user's latest metrics
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of recent entries to fetch
 */
export const getUserLatestMetrics = async (userId, limitCount = 1) => {
    try {
        const metricsQuery = query(
            collection(db, "user_metrics"),
            where("userIdCl", "==", userId),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(metricsQuery);
        const metrics = [];
        
        querySnapshot.forEach((doc) => {
            metrics.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: metrics };
    } catch (error) {
        console.error("Error fetching user metrics:", error);
        return { success: false, error };
    }
};

/**
 * Get user's metrics history for a specific date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for range
 * @param {Date} endDate - End date for range
 */
export const getUserMetricsHistory = async (userId, startDate, endDate) => {
    try {
        const metricsQuery = query(
            collection(db, "user_metrics"),
            where("userIdCl", "==", userId),
            where("timestamp", ">=", startDate.toISOString()),
            where("timestamp", "<=", endDate.toISOString()),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(metricsQuery);
        const metrics = [];
        
        querySnapshot.forEach((doc) => {
            metrics.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: metrics };
    } catch (error) {
        console.error("Error fetching user metrics history:", error);
        return { success: false, error };
    }
};

/**
 * Calculate BMI from weight and height
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 */
export const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 */
export const getBMICategory = (bmi) => {
    if (!bmi) return "Unknown";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
};