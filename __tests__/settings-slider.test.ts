import {
  positionToValue,
  valueToRatio,
  clamp,
} from '../src/features/settings/components/sliderMath';

describe('sliderMath', () => {
  it('maps position to an integer value within bounds', () => {
    expect(positionToValue(0, 200, 12, 24)).toBe(12);
    expect(positionToValue(100, 200, 12, 24)).toBe(18);
    expect(positionToValue(200, 200, 12, 24)).toBe(24);
  });

  it('clamps positions outside the track', () => {
    expect(positionToValue(-50, 200, 8, 28)).toBe(8);
    expect(positionToValue(999, 200, 8, 28)).toBe(28);
  });

  it('returns min when the track is not measured yet', () => {
    expect(positionToValue(50, 0, 8, 28)).toBe(8);
  });

  it('converts a value to a 0..1 ratio', () => {
    expect(valueToRatio(16, 12, 20)).toBe(0.5);
    expect(valueToRatio(5, 12, 20)).toBe(0);
    expect(valueToRatio(99, 12, 20)).toBe(1);
    expect(valueToRatio(3, 3, 3)).toBe(0);
  });

  it('clamp keeps values in range', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});
