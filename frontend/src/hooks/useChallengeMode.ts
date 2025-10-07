import {useCallback, useEffect, useState} from 'react';

import {apiClient} from '../api/client';
import {GameState} from '../types/game';

export const useChallengeMode = (
  challengeId: string | null,
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void,
  setViewToCircle: (
    longitude: number,
    latitude: number,
    radiusKm: number,
  ) => void,
) => {
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [challengeNotFound, setChallengeNotFound] = useState(false);
  const [existingGuess, setExistingGuess] = useState<number | null>(null);

  const loadChallengeData = useCallback(
    async (user: string) => {
      if (!challengeId) return;

      try {
        const data =
          await apiClient.challenge.getChallengeV1ChallengeChallengeIdGet(
            challengeId,
          );

        setGameState(prev => ({
          ...prev,
          mode: 'random',
          latitude: data.latitude,
          longitude: data.longitude,
          radiusKm: data.radius_km,
          sizeClass: data.size_class || null,
          gameId: data.game_id,
        }));

        setViewToCircle(data.longitude, data.latitude, data.radius_km);

        // Check if user already submitted a guess
        try {
          const guessData =
            await apiClient.challenge.getUserGuessV1ChallengeChallengeIdGuessUsernameGet(
              challengeId,
              user,
            );
          if (guessData.guess !== null && guessData.guess !== undefined) {
            setExistingGuess(guessData.guess);
            setGuessSubmitted(true);
          }
        } catch (guessError) {
          console.error('Failed to check existing guess:', guessError);
        }
      } catch (error: any) {
        console.error('Failed to load challenge:', error);
        if (error?.status === 404) {
          setChallengeNotFound(true);
        }
      }
    },
    [challengeId, setGameState, setViewToCircle],
  );

  useEffect(() => {
    if (!challengeId) return;

    const storedUsername = localStorage.getItem('worldguess_username');

    if (storedUsername) {
      setUsername(storedUsername);
      loadChallengeData(storedUsername);
    } else {
      setShowUsernameDialog(true);
    }
  }, [challengeId, loadChallengeData]);

  const handleUsernameSubmit = useCallback(
    async (user: string) => {
      setUsername(user);
      setShowUsernameDialog(false);
      await loadChallengeData(user);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challengeId],
  );

  const submitChallengeGuess = useCallback(
    async (guess: string) => {
      if (!challengeId || !username) return false;

      try {
        await apiClient.challenge.submitGuessV1ChallengeChallengeIdGuessPost(
          challengeId,
          {
            username,
            guess: parseInt(guess),
          },
        );

        const guessValue = parseInt(guess);
        setExistingGuess(guessValue);
        setGuessSubmitted(true);
        return true;
      } catch (error) {
        console.error('Failed to submit guess:', error);
        return false;
      }
    },
    [challengeId, username],
  );

  return {
    username,
    showUsernameDialog,
    guessSubmitted,
    challengeNotFound,
    existingGuess,
    handleUsernameSubmit,
    submitChallengeGuess,
  };
};
