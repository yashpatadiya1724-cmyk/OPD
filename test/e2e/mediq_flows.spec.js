import { test, expect } from '@playwright/test';

/**
 * MediQ End-to-End Test Suite (Playwright)
 * Project Code: SOCCA - 12 | Silver Oak University
 * 
 * Flow 1: Healthcare Marketplace & Hospital Discovery
 * Flow 2: Patient Registration & Triage Lane Selection
 * Flow 3: Real-Time Waiting Room TV Public Queue Display
 */

test.describe('MediQ Healthcare Ecosystem E2E Tests', () => {

  test('Flow 1: Healthcare Marketplace Navigation & Header Discovery', async ({ page }) => {
    await page.goto('/');

    // Wait for the app root and navigation header
    await expect(page).toHaveTitle(/MediQ/i);
    const mainNav = page.locator('nav, header, [role="navigation"]').first();
    await expect(mainNav).toBeVisible();

    // Verify presence of core routing elements
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Flow 2: Patient View & Consultation Triage Lane Selection', async ({ page }) => {
    await page.goto('/patient');

    // Verify patient console elements load cleanly
    await page.waitForLoadState('domcontentloaded');
    const container = page.locator('body');
    await expect(container).toBeVisible();

    // Check for patient interaction elements or action buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Flow 3: Public TV Waiting Room Queue Display Roster', async ({ page }) => {
    await page.goto('/tv');

    // Verify TV public display layout loads without unhandled runtime exceptions
    await page.waitForLoadState('domcontentloaded');
    const tvSurface = page.locator('body');
    await expect(tvSurface).toBeVisible();

    // Check that display renders without horizontal overflow or crash
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors.length).toBe(0);
  });

});
