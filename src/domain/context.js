import { getContext, setContext } from 'svelte';

/**
 * Game Store 的 Context Key
 * 使用 Svelte 的 context API 在组件树中共享 gameStore
 */
export const GAME_STORE_KEY = Symbol('gameStore');

/**
 * 设置 gameStore 到 context
 * @param {Object} gameStore - createGameStore 返回的 store
 */
export function setGameContext(gameStore) {
    setContext(GAME_STORE_KEY, gameStore);
}

/**
 * 从 context 获取 gameStore
 * @returns {Object} gameStore
 */
export function getGameContext() {
    return getContext(GAME_STORE_KEY);
}
