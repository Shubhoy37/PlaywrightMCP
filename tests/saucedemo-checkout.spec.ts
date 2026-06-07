import { test, expect, Page } from '@playwright/test';

// Page Object: Login Page
class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('https://www.saucedemo.com');
  }

  async login(username: string, password: string) {
    await this.page.fill('input[placeholder="Username"]', username);
    await this.page.fill('input[placeholder="Password"]', password);
    await this.page.click('input[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page Object: Inventory Page
class InventoryPage {
  constructor(private page: Page) {}

  async sortByPriceLoToHi() {
    await this.page.selectOption('[data-test="product-sort-container"]', 'lohi');
    await this.page.waitForLoadState('networkidle');
  }

  async addCheapestProductToCart() {
    // After sorting by low to high, the first product is the cheapest
    const addToCartButtons = await this.page.locator('[data-test="add-to-cart-button"]');
    await addToCartButtons.first().click();
    await this.page.waitForTimeout(500); // Wait for cart badge update
  }

  async getCartBadge() {
    return await this.page.locator('[data-test="shopping-cart-badge"]').textContent();
  }

  async navigateToCart() {
    await this.page.goto('https://www.saucedemo.com/cart.html');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page Object: Cart Page
class CartPage {
  constructor(private page: Page) {}

  async getCartItemCount() {
    const items = await this.page.locator('[data-test="cart-list"] [data-test="cart-item"]').count();
    return items;
  }

  async getCartItemPrice() {
    return await this.page.locator('[data-test="inventory-item-price"]').first().textContent();
  }

  async proceedToCheckout() {
    await this.page.click('button[data-test="checkout"]');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page Object: Checkout Step One (User Information)
class CheckoutStepOnePage {
  constructor(private page: Page) {}

  async fillUserInfo(firstName: string, lastName: string, zipCode: string) {
    await this.page.fill('input[data-test="firstName"]', firstName);
    await this.page.fill('input[data-test="lastName"]', lastName);
    await this.page.fill('input[data-test="postalCode"]', zipCode);
  }

  async clickContinue() {
    await this.page.click('input[data-test="continue"]');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page Object: Checkout Step Two (Overview)
class CheckoutStepTwoPage {
  constructor(private page: Page) {}

  async verifyOrderSummary() {
    // Verify product is listed
    const productName = await this.page.locator('[data-test="inventory-item-name"]').textContent();
    const itemTotal = await this.page.locator('[data-test="subtotal-label"]').textContent();
    const tax = await this.page.locator('[data-test="tax-label"]').textContent();
    const total = await this.page.locator('[data-test="total-label"]').textContent();

    return { productName, itemTotal, tax, total };
  }

  async clickFinish() {
    await this.page.click('button[data-test="finish"]');
    await this.page.waitForLoadState('networkidle');
  }
}

// Page Object: Checkout Complete
class CheckoutCompletePage {
  constructor(private page: Page) {}

  async getConfirmationMessage() {
    return await this.page.locator('[data-test="complete-header"]').textContent();
  }

  async getOrderDispatchMessage() {
    return await this.page.locator('[data-test="complete-text"]').textContent();
  }

  async verifyConfirmationPageDisplayed() {
    const confirmationElement = await this.page.locator('[data-test="checkout-complete-container"]');
    return await confirmationElement.isVisible();
  }
}

// Test Suite
test.describe('Sauce Demo Checkout Flow', () => {
  const BASE_URL = 'https://www.saucedemo.com';
  const USERNAME = 'standard_user';
  const PASSWORD = 'secret_sauce';
  const FIRST_NAME = 'John';
  const LAST_NAME = 'Doe';
  const ZIP_CODE = '12345';

  test('Complete checkout flow from login to order confirmation', async ({ page }) => {
    // Step 1: Navigate and Login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USERNAME, PASSWORD);
    
    // Verify inventory page loaded
    await expect(page).toHaveURL(/.*inventory/);
    const pageTitle = await page.locator('span[data-test="title"]').textContent();
    expect(pageTitle).toContain('Products');

    // Step 2: Sort by Price (low to high)
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortByPriceLoToHi();
    
    // Verify sorting dropdown shows selected option
    const sortDropdown = page.locator('[data-test="product-sort-container"]');
    await expect(sortDropdown).toHaveValue('lohi');

    // Step 3: Add cheapest product to cart
    await inventoryPage.addCheapestProductToCart();
    
    // Verify cart badge shows 1 item
    const cartBadge = await inventoryPage.getCartBadge();
    expect(cartBadge).toBe('1');

    // Step 4: Navigate to cart and proceed to checkout
    await inventoryPage.navigateToCart();
    
    const cartPage = new CartPage(page);
    
    // Verify cart contains 1 item
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBe(1);
    
    // Verify cheapest item (Onesie - $7.99) is in cart
    const itemPrice = await cartPage.getCartItemPrice();
    expect(itemPrice).toContain('$7.99');

    // Verify page title
    const cartTitle = await page.locator('span[data-test="title"]').textContent();
    expect(cartTitle).toContain('Your Cart');

    // Proceed to checkout
    await cartPage.proceedToCheckout();
    
    // Verify checkout page loaded
    await expect(page).toHaveURL(/.*checkout-step-one/);

    // Step 5: Fill checkout information
    const checkoutStepOne = new CheckoutStepOnePage(page);
    await checkoutStepOne.fillUserInfo(FIRST_NAME, LAST_NAME, ZIP_CODE);
    
    // Verify form fields are filled
    await expect(page.locator('input[data-test="firstName"]')).toHaveValue(FIRST_NAME);
    await expect(page.locator('input[data-test="lastName"]')).toHaveValue(LAST_NAME);
    await expect(page.locator('input[data-test="postalCode"]')).toHaveValue(ZIP_CODE);

    // Step 6: Click Continue
    await checkoutStepOne.clickContinue();
    
    // Verify checkout overview page loaded
    await expect(page).toHaveURL(/.*checkout-step-two/);
    
    const checkoutStepTwo = new CheckoutStepTwoPage(page);
    
    // Verify order summary
    const orderSummary = await checkoutStepTwo.verifyOrderSummary();
    expect(orderSummary.productName).toContain('Sauce Labs Onesie');
    expect(orderSummary.itemTotal).toContain('$7.99');
    expect(orderSummary.tax).toContain('$0.64');
    expect(orderSummary.total).toContain('$8.63');

    // Step 7: Click Finish
    await checkoutStepTwo.clickFinish();
    
    // Verify order complete page
    await expect(page).toHaveURL(/.*checkout-complete/);

    // Step 8: Verify confirmation message
    const completePage = new CheckoutCompletePage(page);
    
    const isConfirmationVisible = await completePage.verifyConfirmationPageDisplayed();
    expect(isConfirmationVisible).toBe(true);
    
    const confirmationMessage = await completePage.getConfirmationMessage();
    expect(confirmationMessage).toContain('Thank you for your order');
    
    const dispatchMessage = await completePage.getOrderDispatchMessage();
    expect(dispatchMessage).toContain('dispatched');

    // Verify pony express image is displayed
    const ponyImage = page.locator('img[alt="Pony Express"]');
    await expect(ponyImage).toBeVisible();
  });
});
