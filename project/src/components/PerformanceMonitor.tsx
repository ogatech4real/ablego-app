import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getPerformanceMetrics, clearPerformanceMetrics } from '../utils/errorUtils';

interface PerformanceMonitorProps {
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only show in development or for admin users
    const isDev = import.meta.env.DEV;
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    
    if (isDev || isAdmin) {
      setIsVisible(true);
      
      // Refresh metrics every 5 seconds
      const interval = setInterval(() => {
        setMetrics(getPerformanceMetrics());
      }, 5000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, []);

  const handleClearMetrics = () => {
    clearPerformanceMetrics();
    setMetrics([]);
  };

  const getAverageResponseTime = () => {
    if (metrics.length === 0) return 0;
    const completedMetrics = metrics.filter(m => m.duration);
    if (completedMetrics.length === 0) return 0;
    
    const totalTime = completedMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(totalTime / completedMetrics.length);
  };

  const getSuccessRate = () => {
    if (metrics.length === 0) return 0;
    const successful = metrics.filter(m => m.success).length;
    return Math.round((successful / metrics.length) * 100);
  };

  const getSlowRequests = () => {
    return metrics.filter(m => m.duration && m.duration > 5000);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance Monitor
        </h3>
        <button
          onClick={handleClearMetrics}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Requests:</span>
          <span className="font-medium">{metrics.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Response Time:</span>
          <span className="font-medium flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {getAverageResponseTime()}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Success Rate:</span>
          <span className="font-medium flex items-center">
            {getSuccessRate() >= 90 ? (
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 mr-1 text-red-500" />
            )}
            {getSuccessRate()}%
          </span>
        </div>
        
        {getSlowRequests().length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Slow Requests:</span>
            <span className="font-medium flex items-center text-orange-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {getSlowRequests().length}
            </span>
          </div>
        )}
      </div>

      {metrics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Requests:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {metrics.slice(-5).reverse().map((metric) => (
              <div key={metric.requestId} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate max-w-24">
                  {metric.function}
                </span>
                <div className="flex items-center space-x-1">
                  {metric.duration && (
                    <span className={`text-xs ${metric.duration > 5000 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {metric.duration}ms
                    </span>
                  )}
                  {metric.success ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
