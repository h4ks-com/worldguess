import {useCallback, useEffect, useState} from 'react';

import {populationToSlider, sliderToPopulation} from '../utils/population';

export const usePopulationSlider = (userGuess: string, showResult: boolean) => {
  const [sliderValue, setSliderValue] = useState(0);

  // Update slider when manual input changes
  useEffect(() => {
    if (userGuess !== '' && !showResult) {
      const pop = parseInt(userGuess);
      if (!isNaN(pop) && pop >= 0) {
        setSliderValue(populationToSlider(pop));
      }
    }
  }, [userGuess, showResult]);

  const handleSliderChange = useCallback((value: number): string => {
    setSliderValue(value);
    const population = sliderToPopulation(value);
    return population.toString();
  }, []);

  return {
    sliderValue,
    setSliderValue,
    handleSliderChange,
  };
};
