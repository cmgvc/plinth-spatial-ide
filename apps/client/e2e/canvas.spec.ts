import { test, expect } from '@playwright/test';

test('should drag a code block to a new position', async ({ page }) => {
  await page.goto('/?test=true');

  await page.waitForSelector('.react-flow__renderer');

  // Locate the mock node
  const node = page.locator('.react-flow__node').first();
  
  await node.waitFor({ state: 'visible', timeout: 5000 });

  const box = await node.boundingBox();
  if (box) {
    // Grab near the top of the node
    await page.mouse.move(box.x + 100, box.y + 20);
    await page.mouse.down();
    
    // Move it 300 pixels to the right
    await page.mouse.move(box.x + 400, box.y + 20, { steps: 20 });
    await page.mouse.up();
    
    const newBox = await node.boundingBox();
    // Expect the new X position to be greater than the old one
    expect(newBox?.x).toBeGreaterThan(box.x);
  }
});