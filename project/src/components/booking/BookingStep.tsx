import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface BookingStepProps {
  step: number;
  currentStep: number;
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const BookingStep: React.FC<BookingStepProps> = ({
  step,
  currentStep,
  title,
  description,
  isCompleted = false,
  isActive = false,
  onClick
}) => {
  const isClickable = onClick && (isCompleted || isActive);
  
  return (
    <div 
      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
        isCompleted 
          ? 'bg-green-500 border-green-500 text-white' 
          : isActive 
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
      }`}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <span className="text-sm font-medium">{step}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-medium transition-colors duration-200 ${
          isCompleted 
            ? 'text-green-600 dark:text-green-400' 
            : isActive 
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
        }`}>
          {title}
        </h3>
        {description && (
          <p className={`text-xs transition-colors duration-200 ${
            isCompleted 
              ? 'text-green-500 dark:text-green-400' 
              : isActive 
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
          }`}>
            {description}
          </p>
        )}
      </div>
      
      {isActive && (
        <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      )}
    </div>
  );
};

export default BookingStep;
