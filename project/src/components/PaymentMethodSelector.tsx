import React from 'react';
import { CreditCard, Banknote, Clock, CheckCircle, Shield, Zap } from 'lucide-react';

export interface PaymentMethod {
  id: 'cash_bank' | 'stripe';
  label: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
  instructions: string;
  recommended?: boolean;
  benefits?: string[];
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
      label: 'Cash / Bank Transfer',
      description: 'Pay with cash on pickup or bank transfer',
      icon: <Banknote className="w-6 h-6" />,
      processingTime: 'Payment due on pickup',
      instructions: 'Invoice sent to your email with payment instructions',
      recommended: true,
      benefits: [
        'No booking fee or card charges',
        'Cash accepted by driver',
        'Bank transfer details in email',
        'Driver confirms payment received'
      ]
    },
    {
      id: 'stripe',
      label: 'Pay with Card',
      description: 'Secure payment with debit or credit card',
      icon: <CreditCard className="w-6 h-6" />,
      processingTime: 'Instant confirmation',
      instructions: 'Driver dispatched immediately after payment',
      benefits: [
        'Instant payment confirmation',
        'Driver dispatched immediately',
        'Secure payment processing',
        'Digital receipt provided'
      ]
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Booking</h3>
        <p className="text-gray-600">Choose your payment method to complete your booking</p>
      </div>

      {/* Payment Methods Grid - 2 columns on desktop, stacked on mobile */}
      <div className="grid md:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onMethodChange(method.id)}
          >
            {/* Recommended Badge */}
            {method.recommended && (
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                RECOMMENDED
              </div>
            )}

            {/* Header with Icon and Selection */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  selectedMethod === method.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {method.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {method.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {method.description}
                  </p>
                </div>
              </div>
              {selectedMethod === method.id && (
                <CheckCircle className="w-6 h-6 text-blue-600" />
              )}
            </div>

            {/* Processing Time */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">{method.processingTime}</span>
            </div>

            {/* Instructions */}
            <p className="text-sm text-gray-600 mb-4">
              {method.instructions}
            </p>

            {/* Benefits List */}
            <div className="mb-4">
              <ul className="space-y-2">
                {method.benefits?.map((benefit, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Amount Display */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">
                  £{amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedMethod === method.id && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-2 text-green-600" />
          <span>All payments are secure and encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;



