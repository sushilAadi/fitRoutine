"use client";
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { insertUserMetrics, calculateBMI, getBMICategory } from '@/utils/metricsHelper';
import { Button } from '@/components/ui/button';

const MetricsEditor = ({ currentWeight, currentHeight, onUpdate }) => {
    const { user } = useUser();
    const [weight, setWeight] = useState(currentWeight || '');
    const [height, setHeight] = useState(currentHeight || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!user?.id || !weight || !height) return;
        
        setIsLoading(true);
        try {
            const metricsData = {
                weight: parseFloat(weight),
                height: parseFloat(height)
            };

            const result = await insertUserMetrics(
                user.id, 
                metricsData, 
                'update', 
                'profile_edit'
            );

            if (result.success) {
                onUpdate?.(metricsData);
                alert('Metrics updated successfully!');
            } else {
                alert('Failed to update metrics');
            }
        } catch (error) {
            console.error('Error updating metrics:', error);
            alert('Error updating metrics');
        } finally {
            setIsLoading(false);
        }
    };

    const bmi = calculateBMI(parseFloat(weight), parseFloat(height));
    const bmiCategory = getBMICategory(bmi);

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Update Your Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                    </label>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter weight"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                    </label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter height"
                    />
                </div>
            </div>

            {/* BMI Display */}
            {bmi && (
                <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-black">
                        <strong>BMI:</strong> {bmi} ({bmiCategory})
                    </p>
                </div>
            )}

            <Button 
                onClick={handleSave}
                disabled={!weight || !height || isLoading}
                className="w-full"
            >
                {isLoading ? 'Saving...' : 'Save Metrics'}
            </Button>
        </div>
    );
};

export default MetricsEditor;