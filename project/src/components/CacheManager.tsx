import React, { useState } from 'react';
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { clearCacheAndReload } from '../utils/cacheUtils';

interface CacheManagerProps {
  className?: string;
}

const CacheManager: React.FC<CacheManagerProps> = ({ className = '' }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);



  const handleHardReload = () => {
    window.location.reload();
  };

  const handleClearCacheAndReload = async () => {
    setShowConfirm(false);
    setIsClearing(true);
    await clearCacheAndReload();
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleHardReload}
          className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          title="Hard reload page"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Reload
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={isClearing}
          className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium disabled:opacity-50"
          title="Clear all cache and reload"
        >
          {isClearing ? (
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-1"></div>
          ) : (
            <Trash2 className="w-4 h-4 mr-1" />
          )}
          Clear Cache
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Clear Cache and Reload?
              </h3>
              
              <p className="text-gray-600 mb-6">
                This will clear all cached data including login sessions and reload the page. 
                You may need to sign in again.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCacheAndReload}
                  disabled={isClearing}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isClearing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Clearing...
                    </div>
                  ) : (
                    'Clear & Reload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheManager;