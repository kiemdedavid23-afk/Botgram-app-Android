/**
 * Tests des points de dégradé (formule CSS).
 */
import {angleToPoints} from '../src/shared/components/GradientView';

describe('GradientView angleToPoints', () => {
  it('90° (vers la droite)', () => {
    const p = angleToPoints(90);
    expect(p.x1).toBeCloseTo(0, 5);
    expect(p.y1).toBeCloseTo(50, 5);
    expect(p.x2).toBeCloseTo(100, 5);
    expect(p.y2).toBeCloseTo(50, 5);
  });

  it('135°', () => {
    const p = angleToPoints(135);
    expect(p.x1).toBeCloseTo(14.6447, 3);
    expect(p.y1).toBeCloseTo(14.6447, 3);
    expect(p.x2).toBeCloseTo(85.3553, 3);
    expect(p.y2).toBeCloseTo(85.3553, 3);
  });

  it('160°', () => {
    const p = angleToPoints(160);
    expect(p.x1).toBeCloseTo(32.899, 2);
    expect(p.y1).toBeCloseTo(3.015, 2);
    expect(p.x2).toBeCloseTo(67.101, 2);
    expect(p.y2).toBeCloseTo(96.985, 2);
  });

  it('180° (vers le bas)', () => {
    const p = angleToPoints(180);
    expect(p.x1).toBeCloseTo(50, 5);
    expect(p.y1).toBeCloseTo(0, 5);
    expect(p.x2).toBeCloseTo(50, 5);
    expect(p.y2).toBeCloseTo(100, 5);
  });
});
