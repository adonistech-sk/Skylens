// StoreKit 2 through expo-iap. Prices and terms only ever come from the store, and Pro
// is only switched on from an active subscription that the store reports.
import { endConnection, fetchProducts, finishTransaction, getActiveSubscriptions, initConnection, purchaseErrorListener, purchaseUpdatedListener, requestPurchase, restorePurchases } from 'expo-iap';
import { setProActive } from '../../state/store';

export const PRODUCT_IDS = ['com.skylens.pro.monthly', 'com.skylens.pro.annual'];

export interface PlanOption {
  id: string;
  title: string;
  price: string;
  period: 'month' | 'year' | null;
  trial: string | null;
}

export type StoreListener = (e: { kind: 'purchased' } | { kind: 'cancelled' } | { kind: 'failed'; message: string }) => void;

export const storeAvailable = true;

let connected = false;
async function connect() {
  if (connected) return;
  await initConnection();
  connected = true;
}

export async function refreshEntitlement(): Promise<boolean> {
  await connect();
  const active = await getActiveSubscriptions(PRODUCT_IDS);
  const on = active.some((a) => a.isActive);
  setProActive(on);
  return on;
}

export async function loadPlans(): Promise<PlanOption[]> {
  await connect();
  const products = (await fetchProducts({ skus: PRODUCT_IDS, type: 'subs' })) ?? [];
  return (products as unknown as Record<string, unknown>[]).map((p) => {
    const unit = p.subscriptionPeriodUnitIOS as string | null | undefined;
    const mode = p.introductoryPricePaymentModeIOS as string | undefined;
    const trialCount = p.introductoryPriceNumberOfPeriodsIOS as string | null | undefined;
    const trialUnit = p.introductoryPriceSubscriptionPeriodIOS as string | null | undefined;
    return {
      id: p.id as string,
      title: p.title as string,
      price: p.displayPrice as string,
      period: unit?.toLowerCase() === 'month' ? 'month' : unit?.toLowerCase() === 'year' ? 'year' : null,
      trial: mode?.toLowerCase().includes('free') && trialCount && trialUnit ? `${trialCount} ${trialUnit.toLowerCase()} free trial` : null,
    };
  });
}

export function listen(listener: StoreListener) {
  const updated = purchaseUpdatedListener(async (purchase) => {
    await finishTransaction({ purchase, isConsumable: false });
    await refreshEntitlement();
    listener({ kind: 'purchased' });
  });
  const failed = purchaseErrorListener((error) => {
    const code = String((error as { code?: string }).code ?? '').toLowerCase();
    if (code.includes('cancel')) listener({ kind: 'cancelled' });
    else listener({ kind: 'failed', message: error.message ?? 'The purchase could not be completed.' });
  });
  return () => { updated.remove(); failed.remove(); };
}

export const buy = (sku: string) => requestPurchase({ request: { apple: { sku } }, type: 'subs' });

export async function restore(): Promise<boolean> {
  await connect();
  await restorePurchases();
  return refreshEntitlement();
}

export const disconnect = () => { connected = false; return endConnection(); };
