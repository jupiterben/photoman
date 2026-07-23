import { test, expect, navigateToPhotos, openFirstPhotoDetail } from './fixtures/electron-fixture';

test.describe('Photo Detail View', () => {
  test('should open detail view on photo click', async ({ window }) => {
    await navigateToPhotos(window);
    await openFirstPhotoDetail(window);

    await expect(window.locator('[data-testid="photo-viewer"] img')).toBeVisible();
    await expect(window.locator('[data-testid="photo-metadata"]')).toBeVisible();
  });

  test('should navigate with keyboard arrows', async ({ window }) => {
    await navigateToPhotos(window);
    await openFirstPhotoDetail(window);

    const filename = window.locator('[data-testid="photo-filename"]');
    const first = await filename.textContent();
    expect(first).toBeTruthy();

    await window.keyboard.press('ArrowRight');
    await expect(filename).not.toHaveText(first ?? '', { timeout: 3_000 });

    const second = await filename.textContent();
    await window.keyboard.press('ArrowLeft');
    await expect(filename).toHaveText(first ?? '', { timeout: 3_000 });
    expect(second).not.toBe(first);
  });

  test('should zoom and reset without errors', async ({ window }) => {
    await navigateToPhotos(window);
    await openFirstPhotoDetail(window);

    const viewer = window.locator('[data-testid="photo-viewer"]');
    const viewerImg = viewer.locator('img');

    const initialBox = await viewerImg.boundingBox();
    expect(initialBox).not.toBeNull();

    await window.locator('[data-testid="zoom-in-button"]').click();
    await expect
      .poll(async () => (await viewerImg.boundingBox())?.width ?? 0, { timeout: 3_000 })
      .toBeGreaterThan(initialBox!.width);

    await window.locator('[data-testid="reset-zoom-button"]').click();
    await expect
      .poll(async () => (await viewerImg.boundingBox())?.width ?? 0, { timeout: 3_000 })
      .toBeCloseTo(initialBox!.width, 0);
  });

  test('should toggle favorite status', async ({ window }) => {
    await navigateToPhotos(window);
    await openFirstPhotoDetail(window);

    const button = window.locator('[data-testid="favorite-button"]');
    await expect(button).toBeVisible();

    const before = await button.getAttribute('aria-pressed');
    await button.click();
    await expect(button).not.toHaveAttribute('aria-pressed', before ?? 'null', { timeout: 2_000 });

    const after = await button.getAttribute('aria-pressed');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', before ?? 'null', { timeout: 2_000 });
    expect(after).not.toBe(before);
  });

  test('should close on escape key', async ({ window }) => {
    await navigateToPhotos(window);
    await openFirstPhotoDetail(window);

    const modal = window.locator('[data-testid="photo-detail-modal"]');
    await window.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 2_000 });
  });
});
