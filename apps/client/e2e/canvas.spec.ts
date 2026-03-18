import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?test=true');
  await page.evaluate(() => {
    const mockUser = {
      id: "test-user-123",
      username: "test_chloe",
      rootFolders: []
    };
    localStorage.setItem("blonde-user", JSON.stringify(mockUser));
  });
  await page.reload();
});

test('should drag a code block to a new position', async ({ page }) => {
  await page.waitForSelector('.react-flow__renderer', { timeout: 10000 });
  const node = page.locator('.react-flow__node').first();
  await node.waitFor({ state: 'visible', timeout: 5000 });
  const box = await node.boundingBox();
  
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + 20;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 300, startY, { steps: 20 });
    await page.mouse.up();
    
    await page.waitForTimeout(200);

    const newBox = await node.boundingBox();
    
    expect(newBox).not.toBeNull();
    if (newBox) {
      expect(newBox.x).toBeGreaterThan(box.x);
    }
  }
});