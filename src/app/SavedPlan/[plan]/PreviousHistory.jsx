import React, { useEffect, useState, useRef } from 'react'

// ReactBits FadeContent Component
const FadeContent = ({
  children,
  blur = false,
  duration = 1000,
  easing = "ease-out",
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = "",
}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(element);
          setTimeout(() => {
            setInView(true);
          }, delay);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : initialOpacity,
        transition: `opacity ${duration}ms ${easing}, filter ${duration}ms ${easing}`,
        filter: blur ? (inView ? 'blur(0px)' : 'blur(10px)') : 'none',
      }}
    >
      {children}
    </div>
  );
};

const PreviousHistory = ({firebaseStoredData,exerciseId}) => {
    
    const [history, setHistory] = useState([]);

  const extractHistoryByExerciseId = ({ firebaseStoredData, exerciseId }) => {
    const result = [];

    for (const key in firebaseStoredData) {
      const value = firebaseStoredData[key];
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry.exerciseId === exerciseId) {
            result.push(entry);
          }
        });
      }
    }

    // Sort by date (newest first)
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  useEffect(() => {
    if (firebaseStoredData && exerciseId) {
      const filteredHistory = extractHistoryByExerciseId({ firebaseStoredData, exerciseId });
      setHistory(filteredHistory);
    }
  }, [firebaseStoredData, exerciseId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  };

  const getProgressColor = (current, previous) => {
    if (!previous) return 'text-blue-600';
    const currentTotal = (parseFloat(current.weight) || 0) * (parseFloat(current.reps) || 0);
    const previousTotal = (parseFloat(previous.weight) || 0) * (parseFloat(previous.reps) || 0);
    
    if (currentTotal > previousTotal) return 'text-green-600';
    if (currentTotal < previousTotal) return 'text-red-600';
    return 'text-blue-600';
  };

  const getPerformanceIcon = (current, previous) => {
    if (!previous) return '📊';
    const currentTotal = (parseFloat(current.weight) || 0) * (parseFloat(current.reps) || 0);
    const previousTotal = (parseFloat(previous.weight) || 0) * (parseFloat(previous.reps) || 0);
    
    if (currentTotal > previousTotal) return '📈';
    if (currentTotal < previousTotal) return '📉';
    return '➡️';
  };

  return (
    <div className="mb-4 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-sm">📊</span>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-0">Previous Records</h4>
            </div>
          </div>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
            {history.length} entries
          </span>
        </div>
      </div>

      {/* Compact Content */}
      <div className="max-h-64 overflow-y-auto">
        {history.length === 0 ? (
          <FadeContent delay={200} className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xl">💪</span>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-0">No Previous Records</p>
                <p className="text-xs text-gray-500">This will be your first recorded set!</p>
              </div>
            </div>
          </FadeContent>
        ) : (
          <div className="p-2 space-y-2">
            {history.map((item, index) => (
              <FadeContent 
                key={index} 
                delay={index * 50} 
                className="transition-all duration-200 hover:bg-gray-50"
              >
                <div className={`px-3 py-2 rounded-lg border ${
                  item.skipped 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                } transition-all duration-200`}>
                  
                  {item.skipped ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">⏭️</span>
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-0">Skipped</p>
                          <p className="text-xs text-red-500">No data recorded</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(item?.date)}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Top row - Performance indicator and Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getPerformanceIcon(item, history[index + 1])}</span>
                          <span className={`text-xs font-medium ${getProgressColor(item, history[index + 1])}`}>
                            {index === 0 ? 'Latest' : `#${index + 1}`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap">
                          {formatDate(item?.date)}
                        </span>
                      </div>

                      {/* Bottom row - Stats in grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 px-2 py-1 rounded-md">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-xs">🏋️</span>
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {item?.weight || '0'}kg
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-2 py-1 rounded-md">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-xs">🔥</span>
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {item?.reps || '0'} reps
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 px-2 py-1 rounded-md">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-xs">💪</span>
                            <span className="text-xs font-semibold text-blue-600 truncate">
                              {((parseFloat(item?.weight) || 0) * (parseFloat(item?.reps) || 0)).toFixed(0)}kg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FadeContent>
            ))}
          </div>
        )}
      </div>

      {/* Compact Footer Stats */}
      {history.length > 0 && (
        <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0">Best Weight</p>
              <p className="text-xs font-semibold text-gray-800">
                {Math.max(...history.filter(h => !h.skipped).map(h => parseFloat(h.weight) || 0))}kg
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0">Best Reps</p>
              <p className="text-xs font-semibold text-gray-800">
                {Math.max(...history.filter(h => !h.skipped).map(h => parseFloat(h.reps) || 0))} reps
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0">Consistency</p>
              <p className="text-xs font-semibold text-gray-800">
                {Math.round((history.filter(h => !h.skipped).length / history.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviousHistory