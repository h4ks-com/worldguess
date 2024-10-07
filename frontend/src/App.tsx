import React from 'react';

import './App.css';
import {ApiClient, Status} from './api';
import Main from './components/Main';

interface WaitingScreenProps {
  isLoading: boolean;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({isLoading}) => {
  if (!isLoading) {
    return null;
  }
  return (
    <div className='waiting-screen'>
      <h1>Loading...</h1>
    </div>
  );
};

function App() {
  const apiClient = new ApiClient({
    BASE: window.location.origin,
  });
  const [ready, setReady] = React.useState(false);
  const intervalId = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (ready) {
      if (intervalId.current) clearInterval(intervalId.current);
      return;
    }
    intervalId.current = setInterval(() => {
      apiClient.checks
        .checkReadyV1HealthReadyGet()
        .then((status: Status) => {
          if (status.status === Status.status.READY) {
            setReady(true);
          }
        })
        .catch(e => {
          console.error(e);
        });
    }, 2000);
  }, [ready]);

  return (
    <div>
      <WaitingScreen isLoading={!ready} />
      <Main />
    </div>
  );
}

export default App;
