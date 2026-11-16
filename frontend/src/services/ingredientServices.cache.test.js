import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMyIngredients, invalidateIngredientCache, createIngredient, updateIngredient, toggleFavoriteIngredient, deleteIngredient } from './ingredientServices';
const response = data => ({ ok: true, json: async () => data });
beforeEach(() => { invalidateIngredientCache('a'); invalidateIngredientCache('b'); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('shares concurrent reads and reuses data across consumers', async () => {
  let finish;
  fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = getMyIngredients('a');
  const second = getMyIngredients('a');
  finish(response([{ id: 1 }]));
  expect(await first).toEqual(await second);
  expect(await getMyIngredients('a')).toEqual([{ id: 1 }]);
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('isolates users and expires cached reads', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
  fetch.mockResolvedValueOnce(response([{ id: 1 }])).mockResolvedValueOnce(response([{ id: 2 }])).mockResolvedValueOnce(response([]));
  await getMyIngredients('a');
  expect(await getMyIngredients('b')).toEqual([{ id: 2 }]);
  now.mockReturnValue(31001);
  expect(await getMyIngredients('b')).toEqual([]);
  expect(fetch).toHaveBeenCalledTimes(3);
});
it.each([createIngredient, updateIngredient, toggleFavoriteIngredient, deleteIngredient])('invalidates after a successful mutation', async mutate => {
  fetch.mockResolvedValue(response([]));
  await getMyIngredients('a');
  await mutate('a', {} , {});
  await getMyIngredients('a');
  expect(fetch).toHaveBeenCalledTimes(3);
});
it('sends favorite flag in toggleFavoriteIngredient and throws on failure', async () => {
  fetch.mockResolvedValueOnce(response({ id: 5, name: 'Milk', favorite: true }));
  const updated = await toggleFavoriteIngredient('a', 5, true);
  expect(updated).toEqual({ id: 5, name: 'Milk', favorite: true });
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ingredients/5/favorite'), expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify({ favorite: true }),
  }));

  fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Forbidden' }) });
  await expect(toggleFavoriteIngredient('a', 5, false)).rejects.toThrow('Forbidden');
});
it('retries failed reads', async () => {
  fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response([]));
  await expect(getMyIngredients('a')).rejects.toThrow('offline');
  expect(await getMyIngredients('a')).toEqual([]);
});
it('does not let an old pending read replace data after invalidation', async () => {
  let finish;
  fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const old = getMyIngredients('a');
  invalidateIngredientCache('a');
  fetch.mockResolvedValueOnce(response([{ id: 2 }]));
  await getMyIngredients('a');
  finish(response([{ id: 1 }]));
  await old;
  expect(await getMyIngredients('a')).toEqual([{ id: 2 }]);
});
