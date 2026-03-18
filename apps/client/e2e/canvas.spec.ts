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
    (window as any).isTest = true;
  });
  await page.reload();
  const welcomeButton = page.getByRole('button', { name: /enter workspace/i });
  if (await welcomeButton.count() > 0) {
    await welcomeButton.click();
    await expect(welcomeButton).toBeHidden();
  }

  await page.evaluate(() => {
    const store = (window as any).__REDUX_STORE__;
    if (store) {
      store.dispatch({
        type: 'files/addNode',
        payload: {
          id: 'test-node',
          type: 'fileNode',
          position: { x: 100, y: 100 },
          data: { 
            filename: 'test.ts', 
            code: 'console.log("hello")', 
            syncStatus: 'synced' 
          }
        }
      });
    }
  });
});

test('should drag a code block to a new position', async ({ page }) => {
  const node = page.locator('.react-flow__node').first();
  await expect(node).toBeVisible({ timeout: 10000 });

  const box = await node.boundingBox();
  
  if (box) {
    const startX = box.x + (box.width / 2);
    const startY = box.y + 15;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 200, startY + 50, { steps: 20 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);

    const newBox = await node.boundingBox();
    expect(newBox?.x).toBeGreaterThan(box.x);
  }
});