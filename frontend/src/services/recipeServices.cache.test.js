import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getAllRecipes, invalidateRecipeCache, createRecipe } from './recipeServices';
const response = data => ({ ok: true, json: async () => data });

beforeEach(() => {
  invalidateRecipeCache();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); invalidateRecipeCache(); });

describe('public recipe catalog cache', () => {
  it('shares concurrent requests and reuses a fresh response', async () => {
    let finish;
    fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const first = getAllRecipes();
    const second = getAllRecipes();
    finish(response([{ id: 1 }]));
    expect(await first).toEqual(await second);
    expect(await getAllRecipes()).toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('expires after 30 seconds and lets explicit refresh bypass the cache', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    fetch.mockResolvedValue(response([{ id: 1 }]));
    await getAllRecipes(); await getAllRecipes();
    expect(fetch).toHaveBeenCalledTimes(1);
    now.mockReturnValue(31001);
    await getAllRecipes();
    expect(fetch).toHaveBeenCalledTimes(2);
    await getAllRecipes({ force: true });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('invalidates cached content after a successful write', async () => {
    fetch.mockResolvedValueOnce(response([{ id: 1 }]));
    fetch.mockResolvedValueOnce(response({ id: 2 }));
    fetch.mockResolvedValueOnce(response([{ id: 1 }, { id: 2 }]));
    await getAllRecipes();
    await createRecipe({ name: 'Soup', instructions: 'Simmer.' });
    expect(await getAllRecipes()).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('does not retain failed requests', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(getAllRecipes()).rejects.toThrow('Could not reach the backend');
    fetch.mockResolvedValueOnce(response([]));
    expect(await getAllRecipes()).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('does not cancel another consumer when a picker closes', async () => {
    let finish;
    fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const controller = new AbortController();
    const closingPicker = getAllRecipes({ signal: controller.signal });
    const otherPanel = getAllRecipes();
    controller.abort();
    await expect(closingPicker).rejects.toMatchObject({ name: 'AbortError' });
    finish(response([{ id: 3 }]));
    expect(await otherPanel).toEqual([{ id: 3 }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not let an older in-flight read repopulate an invalidated cache', async () => {
    let finishOld;
    fetch.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const oldRead = getAllRecipes();
    invalidateRecipeCache();
    fetch.mockResolvedValueOnce(response([{ id: 4 }]));
    expect(await getAllRecipes()).toEqual([{ id: 4 }]);
    finishOld(response([{ id: 1 }]));
    await oldRead;
    expect(await getAllRecipes()).toEqual([{ id: 4 }]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
