import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { gsap } from 'gsap';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  label: string;
  className?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  min,
  max,
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value.toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState(value.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(Math.floor(value.getMinutes() / 15) * 15);
  const [selectedPeriod, setSelectedPeriod] = useState(value.getHours() >= 12 ? 'PM' : 'AM');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Update internal state when value prop changes
    setSelectedDate(value.toISOString().split('T')[0]);
    setSelectedHour(value.getHours() % 12 || 12);
    setSelectedMinute(Math.floor(value.getMinutes() / 15) * 15);
    setSelectedPeriod(value.getHours() >= 12 ? 'PM' : 'AM');
  }, [value]);

  useEffect(() => {
    // Animate dropdown appearance
    if (isOpen && dropdownRef.current) {
      gsap.fromTo(dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplayTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${date.toLocaleDateString()} at ${displayHours}:${displayMinutes} ${period}`;
  };

  const handleSet = () => {
    // Convert 12-hour format to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 += 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }

    // Create new date with selected values
    const newDate = new Date(selectedDate);
    newDate.setHours(hour24, selectedMinute, 0, 0);

    // Validate against min/max
    if (min && newDate < min) {
      return; // Don't set if before minimum
    }
    if (max && newDate > max) {
      return; // Don't set if after maximum
    }

    onChange(newDate);
    setIsOpen(false);

    // Animate button success
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }
  };

  const handleCancel = () => {
    // Reset to current value
    setSelectedDate(value.toISOString().split('T')[0]);
    setSelectedHour(value.getHours() % 12 || 12);
    setSelectedMinute(Math.floor(value.getMinutes() / 15) * 15);
    setSelectedPeriod(value.getHours() >= 12 ? 'PM' : 'AM');
    setIsOpen(false);
  };

  const getMinDate = (): string => {
    if (min) {
      return min.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = (): string => {
    if (max) {
      return max.toISOString().split('T')[0];
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 transition-all duration-300 bg-white"
      >
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-500 mr-3" />
          <span className="text-gray-700 font-medium">
            {formatDisplayTime(value)}
          </span>
        </div>
        <Clock className="w-5 h-5 text-gray-400" />
      </button>

      {/* Custom Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-w-sm"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3 text-white">
            <h4 className="font-medium text-center text-sm">Select Date & Time</h4>
          </div>

          <div className="p-4 space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Hour */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">Hour</label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>

                {/* Minute */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">Min</label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                  >
                    {[0, 15, 30, 45].map(minute => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM/PM */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">AM/PM</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-xs text-blue-800 text-center">
                <Clock className="w-4 h-4 inline-block mr-1" />
                Selected: {new Date(selectedDate).toLocaleDateString()} at {selectedHour}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSet}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center text-sm"
              >
                <Check className="w-3 h-3 mr-1" />
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;