import React, {useState} from 'react';

interface UsernameDialogProps {
  onSubmit: (username: string) => void;
}

export const UsernameDialog: React.FC<UsernameDialogProps> = ({onSubmit}) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length > 50) {
      setError('Username must be 50 characters or less');
      return;
    }

    localStorage.setItem('worldguess_username', username.trim());
    onSubmit(username.trim());
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-2xl p-8 max-w-md w-full mx-4'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          Enter Your Username
        </h2>
        <p className='text-gray-600 mb-6'>
          Choose a username to participate in this challenge
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type='text'
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder='Your username'
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
            autoFocus
            maxLength={50}
          />

          {error && <p className='text-red-600 text-sm mb-4'>{error}</p>}

          <button
            type='submit'
            className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors'
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};
