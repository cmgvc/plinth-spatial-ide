import { test, expect } from '@playwright/test';

test('should drag a code block to a new position', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const node = page.locator('.react-flow__node').first();
  const box = await node.boundingBox();

  if (box) {
    // Drag from center of node 200px to the right
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
  }

  // Verify the node style attribute updated its transform/position
  const updatedBox = await node.boundingBox();
  expect(updatedBox?.x).toBeGreaterThan(box?.x || 0);
});