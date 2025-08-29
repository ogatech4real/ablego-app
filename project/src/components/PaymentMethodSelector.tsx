import React from 'react';
import { CreditCard, Banknote, Clock, CheckCircle } from 'lucide-react';

export interface PaymentMethod {
  id: 'cash_bank' | 'stripe';
  label: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
  instructions: string;
  recommended?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: 'cash_bank' | 'stripe';
  onMethodChange: (method: 'cash_bank' | 'stripe') => void;
  amount: number;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  amount,
  className = ''
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash_bank',
      label: 'Cash or Bank Transfer',
      description: 'Pay with cash on pickup or bank transfer',
      icon: <Banknote className="w-6 h-6" />,
      processingTime: 'Payment due on pickup',
      instructions: 'Invoice sent to your email with payment instructions',
      recommended: true
    },
    {
      id: 'stripe',
      label: 'Pay with Card',
      description: 'Secure payment with debit or credit card',
      icon: <CreditCard className="w-6 h-6" />,
      processingTime: 'Instant confirmation',
      instructions: 'Driver dispatched immediately after payment'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Payment Method</h3>
        <p className="text-gray-600">Select how you'd like to pay for your journey</p>
      </div>

      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onMethodChange(method.id)}
          >
            {/* Recommended Badge */}
            {method.recommended && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                RECOMMENDED
              </div>
            )}

            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`p-3 rounded-lg ${
                selectedMethod === method.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {method.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {method.label}
                  </h4>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">
                  {method.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  {method.processingTime}
                </div>

                <p className="text-sm text-gray-600">
                  {method.instructions}
                </p>
              </div>
            </div>

            {/* Amount Display */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">
                  £{amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method Specific Information */}
      {selectedMethod === 'cash_bank' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Cash/Bank Payment Details</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Payment due on pickup (before drop-off)</li>
            <li>• Cash accepted by driver</li>
            <li>• Bank transfer details sent to your email</li>
            <li>• Driver will confirm payment received</li>
            <li>• No booking fee or card processing charges</li>
          </ul>
        </div>
      )}

      {selectedMethod === 'stripe' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Card Payment Benefits</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Instant payment confirmation</li>
            <li>• Driver dispatched immediately</li>
            <li>• Secure payment processing</li>
            <li>• Digital receipt provided</li>
            <li>• No cash handling required</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;


