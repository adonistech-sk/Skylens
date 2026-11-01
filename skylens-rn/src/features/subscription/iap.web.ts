// There is no App Store on the web, so the paywall shows its unavailable state.
export const PRODUCT_IDS = ['com.skylens.pro.monthly', 'com.skylens.pro.annual'];
export interface PlanOption { id: string; title: string; price: string; period: 'month' | 'year' | null; trial: string | null }
export type StoreListener = (e: { kind: 'purchased' } | { kind: 'cancelled' } | { kind: 'failed'; message: string }) => void;
export const storeAvailable = false;
export const refreshEntitlement = async () => false;
export const loadPlans = async (): Promise<PlanOption[]> => [];
export const listen = (_: StoreListener) => () => {};
export const buy = async (_: string) => {};
export const restore = async () => false;
export const disconnect = async () => {};
