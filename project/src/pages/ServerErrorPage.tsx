import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const ServerErrorPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Server Error - AbleGo</title>
        <meta name="description" content="Something went wrong on our end. Please try again." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">500</h1>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Server Error
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Something went wrong on our end. Please try again later or contact support if the problem persists.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Go Home
            </Link>
            <Link
              to="/contact"
              className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServerErrorPage;
