import { test, expect } from '@playwright/test';

test.describe('Sauce Demo Checkout Flow', () => {

  test('Complete checkout flow from login to order confirmation', async ({ page }) => {

    // Step 1 - Navigate to site
    await page.goto('https://www.saucedemo.com');

    // Step 2 - Login
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');

    // Step 3 - Verify logged in
    await expect(page).toHaveURL(/inventory/);

    // Step 4 - Sort by price low to high
    await page.selectOption('[data-test="product-sort-container"]', 'lohi');

    // Step 5 - Add cheapest item (Sauce Labs Bike Light after sorting)
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');

    // Step 6 - Verify cart badge shows 1
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    // Step 7 - Go to cart
    await page.click('[data-test="shopping-cart-link"]');
    await expect(page).toHaveURL(/cart/);

    // Step 8 - Proceed to checkout
    await page.click('[data-test="checkout"]');

    // Step 9 - Fill checkout info
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');

    // Step 10 - Finish order
    await page.click('[data-test="finish"]');

    // Step 11 - Verify order confirmation
    await expect(page.locator('[data-test="complete-header"]'))
      .toHaveText('Thank you for your order!');

  });

});