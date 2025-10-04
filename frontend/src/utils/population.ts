import {MAX_EXPONENT, MIN_EXPONENT, SLIDER_STEPS} from '../constants/map';

// Convert slider position (0-100) to population (10^0 to 10^10)
export const sliderToPopulation = (slider: number): number => {
  if (slider === 0) return 0;
  const exponent =
    MIN_EXPONENT + (slider / SLIDER_STEPS) * (MAX_EXPONENT - MIN_EXPONENT);
  return Math.round(Math.pow(10, exponent));
};

// Convert population to slider position
export const populationToSlider = (population: number): number => {
  if (population <= 1) return 0;
  const exponent = Math.log10(population);
  const slider =
    ((exponent - MIN_EXPONENT) / (MAX_EXPONENT - MIN_EXPONENT)) * SLIDER_STEPS;
  return Math.max(0, Math.min(SLIDER_STEPS, Math.round(slider)));
};
