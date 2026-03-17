import { describe, it, expect } from 'vitest';
import { isOverlapping } from './spatial';

describe('Spatial Logic', () => {
  it('should detect when two code blocks overlap', () => {
    const nodeA = { x: 0, y: 0, width: 100, height: 100 };
    const nodeB = { x: 50, y: 50, width: 100, height: 100 };
    
    expect(isOverlapping(nodeA, nodeB)).toBe(true);
  });
});