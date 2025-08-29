import React, { useEffect, useRef } from 'react';
import { Car, Clock, Loader, MapPin } from 'lucide-react';
import { gsap } from 'gsap';
import type { TravelInfo as TravelInfoType } from '../services/googleMapsService';

interface TravelInfoProps {
  travelInfo: TravelInfoType | null;
  isLoading: boolean;
  stopsCount?: number;
  className?: string;
}

const TravelInfo: React.FC<TravelInfoProps> = ({ 
  travelInfo, 
  isLoading, 
  stopsCount = 0,
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (travelInfo && containerRef.current) {
      // Animate container appearance
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.5, 
          ease: "back.out(1.7)" 
        }
      );

      // Animate individual info items
      gsap.fromTo([distanceRef.current, timeRef.current],
        { opacity: 0, x: -20 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.4, 
          stagger: 0.1, 
          delay: 0.2,
          ease: "power2.out" 
        }
      );
    }
  }, [travelInfo]);

  if (isLoading) {
    return (
      <div className={`bg-blue-50 border-2 border-blue-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium">
            Calculating {stopsCount > 0 ? 'multi-stop ' : ''}route...
          </span>
        </div>
      </div>
    );
  }

  if (!travelInfo) {
    return (
      <div className={`bg-gray-50 border-2 border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3 text-gray-500">
          <MapPin className="w-5 h-5" />
          <span className="font-medium">
            Enter all addresses to see travel info
          </span>
        </div>
      </div>
    );
  }

  if (travelInfo.status === 'ERROR') {
    return (
      <div className={`bg-red-50 border-2 border-red-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-3 text-red-600">
          <MapPin className="w-5 h-5" />
          <span className="font-medium">Unable to calculate route</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4 ${className}`}
    >
      <div className="grid grid-cols-2 gap-4">
        <div 
          ref={distanceRef}
          className="flex items-center space-x-3"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Distance</p>
            <p className="text-lg font-bold text-green-700">
              {travelInfo.distance.text}
            </p>
          </div>
        </div>

        <div 
          ref={timeRef}
          className="flex items-center space-x-3"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Travel Time</p>
            <p className="text-lg font-bold text-blue-700">
              {travelInfo.duration.text}
            </p>
          </div>
        </div>
      </div>

      {/* Route visualization indicator */}
      <div className="mt-3 pt-3 border-t border-green-200">
        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-green-300 to-orange-300"></div>
          {stopsCount > 0 && (
            <>
              {Array.from({ length: stopsCount }).map((_, index) => (
                <React.Fragment key={index}>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-blue-300"></div>
                </React.Fragment>
              ))}
            </>
          )}
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-1">
          {stopsCount > 0 ? `Multi-stop route (${stopsCount + 2} locations)` : 'Direct route'}
        </p>
      </div>
    </div>
  );
};

export default TravelInfo;