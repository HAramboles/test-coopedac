import { Page } from '@playwright/test';

let page: Page;

export const modoOscuroClaro = async () => {
    await page.locator('text=SOCIOS').click();
};
