import { test, expect, navigateToPhotos } from './fixtures/electron-fixture';

test.describe('Photo Grid Performance', () => {
  test('should render visible cards within a virtualized window', async ({ window }) => {
    await navigateToPhotos(window);

    const totalCards = await window.locator('[data-testid="photo-card"]').count();
    test.skip(totalCards === 0, 'no photos in fixture data');

    const visibleCards = await window.locator('[data-testid="photo-card"]:visible').count();
    expect(visibleCards).toBeGreaterThan(0);
    expect(visibleCards).toBeLessThan(totalCards || Number.MAX_SAFE_INTEGER);
  });

  test('should load thumbnails progressively', async ({ window }) => {
    await navigateToPhotos(window);

    const firstImg = window.locator('[data-testid="photo-card"] img').first();
    await expect(firstImg).toHaveAttribute('src', /.+/, { timeout: 5_000 });

    const initialLoaded = await window.locator('[data-testid="photo-card"] img[src]').count();
    const totalCards = await window.locator('[data-testid="photo-card"]').count();
    test.skip(totalCards <= initialLoaded, 'all thumbnails already loaded');

    await window.keyboard.press('End');
    await expect
      .poll(async () => window.locator('[data-testid="photo-card"] img[src]').count(), {
        timeout: 5_000,
      })
      .toBeGreaterThan(initialLoaded);
  });

  test('should support different thumbnail sizes', async ({ window }) => {
    await navigateToPhotos(window);

    const card = window.locator('[data-testid="photo-card"]').first();
    await expect(card).toBeVisible();

    const small = await card.boundingBox();
    await window.locator('[data-testid="thumbnail-size-small"]').click();
    await expect
      .poll(async () => (await card.boundingBox())?.width ?? 0)
      .toBeLessThan(small?.width ?? Number.MAX_SAFE_INTEGER);

    const medium = await card.boundingBox();
    await window.locator('[data-testid="thumbnail-size-medium"]').click();
    await expect
      .poll(async () => (await card.boundingBox())?.width ?? 0)
      .toBeGreaterThan(medium?.width ?? 0);

    const large = await card.boundingBox();
    await window.locator('[data-testid="thumbnail-size-large"]').click();
    await expect
      .poll(async () => (await card.boundingBox())?.width ?? 0)
      .toBeGreaterThan(large?.width ?? 0);
  });
});
