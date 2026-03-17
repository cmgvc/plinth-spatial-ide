import { test, expect } from '@playwright/test';

test('should drag a code block to a new position', async ({ page }) => {
  await page.goto('/');

  // 1. Wait for the node to actually appear in the DOM
  const node = page.locator('.react-flow__node').first();
  await node.waitFor({ state: 'visible', timeout: 5000 });

  const box = await node.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // 2. Perform the drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 200, startY, { steps: 10 });
    await page.mouse.up();
  }
});