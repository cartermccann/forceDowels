// lib/shipping-live.ts
import type { ShippingOption } from './shipping';

// Input you’ll pass from checkout/cart
export interface LiveQuoteInput {
  originZip: string;            // e.g., "852xx"
  destCountry: string;          // "US" | "CA" | "MX"
  destPostal: string;           // ZIP/Postal
  weightLbs?: number;           // for UPS
  weightOz?: number;            // for USPS
  dims?: { l: number; w: number; h: number }; // inches (optional)
  residential?: boolean;
}

// If your UPS/USPS modules already expose different names, just adjust the imports below.
import * as uspsMod from './usps';
import * as upsMod from './ups';

// Tell the aggregator which functions to call in your existing files.
// If your file exports different names, change these 2 lines only.
const getUSPSRates = (uspsMod as any).getUSPSRates || (uspsMod as any).getRates || (uspsMod as any).listRates;
const getUPSRates  = (upsMod  as any).getUPSRates  || (upsMod  as any).getRates  || (upsMod  as any).listRates;

// +$10 temporary bump for UPS (requested)
const UPS_PRICE_BUMP = 10.00;

type RawRate = {
  service?: string;
  name?: string;              // some adapters use "name"
  costCents?: number;
  amount?: number;            // dollars
  price?: number;             // dollars
  rate?: number;              // dollars
  estDays?: number | string;
  delivery_date?: string;
  delivery_date_guaranteed?: boolean;
};

function dollarsFrom(raw: RawRate): number {
  if (typeof raw.price === 'number') return raw.price;
  if (typeof raw.amount === 'number') return raw.amount;
  if (typeof raw.rate === 'number') return raw.rate;
  if (typeof raw.costCents === 'number') return raw.costCents / 100;
  return NaN;
}

function toOption(carrier: 'UPS' | 'USPS', r: RawRate): ShippingOption | null {
  const price = dollarsFrom(r);
  if (!Number.isFinite(price)) return null;

  const bump = carrier === 'UPS' ? UPS_PRICE_BUMP : 0;
  const finalPrice = Math.max(0, price + bump);

  const serviceName = (r.service || r.name || 'Service').toString();

  // Make id stable for your calculator functions
  const id = `${carrier}:${serviceName}`;

  const estimated =
    typeof r.estDays === 'number' ? `${r.estDays} business days`
    : typeof r.estDays === 'string' && r.estDays.trim() ? r.estDays
    : r.delivery_date ? 'Estimated delivery shown at checkout'
    : 'Estimated delivery shown at checkout';

  return {
    id,
    name: `${carrier} — ${serviceName}`,
    description: estimated,
    price: Number(finalPrice.toFixed(2)),
    estimatedDays: estimated,
    carrier,
    service: serviceName,
    delivery_date: r.delivery_date,
    delivery_date_guaranteed: r.delivery_date_guaranteed
  };
}

export async function getLiveShippingOptions(input: LiveQuoteInput): Promise<ShippingOption[]> {
  const results: ShippingOption[] = [];

  const tasks: Promise<void>[] = [];

  // USPS
  if (typeof getUSPSRates === 'function') {
    tasks.push(
      Promise.resolve()
        .then(async () => {
          const rates = await getUSPSRates(input);
          const arr = Array.isArray(rates) ? rates : [];
          for (const r of arr) {
            const opt = toOption('USPS', r);
            if (opt) results.push(opt);
          }
        })
        .catch(() => {})
    );
  }

  // UPS
  if (typeof getUPSRates === 'function') {
    tasks.push(
      Promise.resolve()
        .then(async () => {
          const rates = await getUPSRates(input);
          const arr = Array.isArray(rates) ? rates : [];
          for (const r of arr) {
            const opt = toOption('UPS', r);
            if (opt) results.push(opt);
          }
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(tasks);

  // Sort cheapest first
  results.sort((a, b) => a.price - b.price);

  return results;
}
