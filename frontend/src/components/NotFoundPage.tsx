import * as React from 'react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-800 mb-4'>404</h1>
        <h2 className='text-2xl font-semibold text-gray-600 mb-4'>
          Challenge Not Found
        </h2>
        <p className='text-gray-500 mb-8'>
          The challenge you're looking for doesn't exist or has already ended.
        </p>
        <a
          href='/'
          className='px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors'
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};
