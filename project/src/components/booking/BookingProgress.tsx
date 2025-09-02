import React from 'react';
import BookingStep from './BookingStep';

interface BookingProgressProps {
  currentStep: 'booking' | 'guest-info' | 'password' | 'confirmation';
  onStepClick: (step: 'booking' | 'guest-info' | 'password' | 'confirmation') => void;
}

const BookingProgress: React.FC<BookingProgressProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    {
      key: 'booking' as const,
      title: 'Journey Details',
      description: 'Enter pickup, dropoff, and requirements'
    },
    {
      key: 'guest-info' as const,
      title: 'Personal Information',
      description: 'Provide your contact details'
    },
    {
      key: 'password' as const,
      title: 'Account Setup',
      description: 'Create password (optional)'
    },
    {
      key: 'confirmation' as const,
      title: 'Confirmation',
      description: 'Review and confirm booking'
    }
  ];

  const getStepNumber = (stepKey: string) => {
    return steps.findIndex(step => step.key === stepKey) + 1;
  };

  const isStepCompleted = (stepKey: string) => {
    const stepOrder = ['booking', 'guest-info', 'password', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    return stepIndex < currentIndex;
  };

  const isStepActive = (stepKey: string) => stepKey === currentStep;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Booking Progress
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Step {getStepNumber(currentStep)} of {steps.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step) => (
          <BookingStep
            key={step.key}
            step={getStepNumber(step.key)}
            currentStep={getStepNumber(currentStep)}
            title={step.title}
            description={step.description}
            isCompleted={isStepCompleted(step.key)}
            isActive={isStepActive(step.key)}
            onClick={() => onStepClick(step.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default BookingProgress;
