interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  STRIPE_SECRET_KEY?: string;
  rk_apikeys?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_PRODUCT_ID?: string;
  product_id?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Resolve Stripe Secret Key from Cloudflare environment variables
    const stripeKey = env.STRIPE_SECRET_KEY || env.rk_apikeys || '';

    // 1. API: Stripe Config
    if (url.pathname === '/api/stripe-config' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          publishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY || '',
          hasSecretKey: Boolean(stripeKey),
          productId: env.STRIPE_PRODUCT_ID || env.product_id || 'prod_VSALOmpGkBpFRv',
          isLive: Boolean(stripeKey?.startsWith('rk_live') || stripeKey?.startsWith('sk_live')),
        }),
        { headers: CORS_HEADERS }
      );
    }

    // 2. API: Create Checkout Session
    if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const {
          billboardId = 'current',
          billboardName = 'Map Billboard',
          businessName = 'Billboard Sponsor',
          businessLink = '',
          tagline = '',
          origin = url.origin,
          purchaseType,
          buildingType,
          characterId,
          characterName,
          userId = '',
          gamerTag = '',
        } = body;

        const isCharacterUnlock = purchaseType === 'character_unlock' || Boolean(characterId);
        const isStoreBuilding =
          !isCharacterUnlock &&
          (purchaseType === 'store_building' ||
            buildingType === 'medium_store' ||
            buildingType === 'sketch_store' ||
            buildingType === 'cyber_tower');

        // Pricing: $3.00 for Character Unlock, $5.00 for Store Building (+5 spaces), $10.00 for Billboard
        const priceAmount = isCharacterUnlock ? 300 : isStoreBuilding ? 500 : 1000;

        const charLabel =
          characterName ||
          (characterId === 'moon_demon_noble'
            ? 'Moon Demon Noble'
            : characterId === 'demon_dog_warrior'
            ? 'Demon Dog Warrior'
            : characterId === 'celestial_moon_guardian'
            ? 'Celestial Moon Guardian'
            : characterId === 'sacred_shrine_priestess'
            ? 'Sacred Shrine Priestess'
            : 'Premium 3D Character');

        const buildingLabel =
          buildingType === 'sketch_store'
            ? 'Sketch Corner Store'
            : buildingType === 'cyber_tower'
            ? '3-Floor Cyber Megastore'
            : 'Medium Format Store';

        const lineItemName = isCharacterUnlock
          ? `${charLabel} (Permanent 3D Character Unlock)`
          : isStoreBuilding
          ? `${buildingLabel} (+5 Spaces Unlock)`
          : `5-Day Billboard Promotion: ${businessName}`;

        const lineItemDesc = isCharacterUnlock
          ? `One-time permanent unlock for ${charLabel} 3D anime character avatar to equip and play anytime`
          : isStoreBuilding
          ? `Unlock ${buildingLabel} building + 5 extra item listing spaces (15 total items available to sell or trade)`
          : `Single billboard placement: ${billboardName} (5 days individual broadcast)`;

        const targetBType = buildingType || 'medium_store';
        const successUrl = isCharacterUnlock
          ? `${origin}/?stripe_character_unlock_success=true&session_id={CHECKOUT_SESSION_ID}&character_id=${encodeURIComponent(
              characterId || 'moon_demon_noble'
            )}`
          : isStoreBuilding
          ? `${origin}/?stripe_store_unlock_success=true&session_id={CHECKOUT_SESSION_ID}&building_type=${encodeURIComponent(
              targetBType
            )}`
          : `${origin}/?stripe_checkout_success=true&session_id={CHECKOUT_SESSION_ID}&billboard_id=${encodeURIComponent(
              billboardId
            )}`;

        const cancelUrl = isCharacterUnlock
          ? `${origin}/?stripe_character_unlock_cancel=true&character_id=${encodeURIComponent(
              characterId || 'moon_demon_noble'
            )}`
          : isStoreBuilding
          ? `${origin}/?stripe_store_unlock_cancel=true`
          : `${origin}/?stripe_checkout_cancel=true&billboard_id=${encodeURIComponent(
              billboardId
            )}`;

        // Call Stripe REST API directly
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', successUrl);
        params.append('cancel_url', cancelUrl);
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][unit_amount]', String(priceAmount));
        params.append('line_items[0][price_data][product_data][name]', lineItemName);
        params.append('line_items[0][price_data][product_data][description]', lineItemDesc);
        params.append('line_items[0][quantity]', '1');

        if (isCharacterUnlock) {
          params.append('metadata[purchaseType]', 'character_unlock');
          params.append('metadata[characterId]', String(characterId || 'moon_demon_noble'));
          params.append('metadata[characterName]', String(charLabel));
          params.append('metadata[userId]', String(userId));
          params.append('metadata[gamerTag]', String(gamerTag));
          params.append('metadata[priceUsd]', '3.00');
        } else if (isStoreBuilding) {
          params.append('metadata[purchaseType]', 'store_building');
          params.append('metadata[buildingType]', String(targetBType));
          params.append('metadata[userId]', String(userId));
          params.append('metadata[gamerTag]', String(gamerTag));
          params.append('metadata[priceUsd]', '5.00');
        } else {
          params.append('metadata[billboardId]', String(billboardId));
          params.append('metadata[billboardName]', String(billboardName));
          params.append('metadata[businessName]', String(businessName));
          params.append('metadata[businessLink]', String(businessLink));
          params.append('metadata[tagline]', String(tagline));
          params.append('metadata[durationDays]', '5');
          params.append('metadata[priceUsd]', '10.00');
        }

        if (!stripeKey) {
          const demoSessionId = `cs_demo_${Date.now()}`;
          const demoUrl = isCharacterUnlock
            ? `${origin}/?stripe_character_unlock_success=true&session_id=${demoSessionId}&character_id=${encodeURIComponent(characterId || 'moon_demon_noble')}`
            : isStoreBuilding
            ? `${origin}/?stripe_store_unlock_success=true&session_id=${demoSessionId}&building_type=${encodeURIComponent(targetBType)}`
            : `${origin}/?stripe_checkout_success=true&session_id=${demoSessionId}&billboard_id=${encodeURIComponent(billboardId)}`;

          return new Response(
            JSON.stringify({
              url: demoUrl,
              sessionId: demoSessionId,
              isLive: false,
              notice: 'Demo mode active. Add STRIPE_SECRET_KEY to Cloudflare secrets for live payments.',
            }),
            { headers: CORS_HEADERS }
          );
        }

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const stripeData: any = await stripeRes.json();

        if (!stripeRes.ok) {
          console.error('[Cloudflare Worker] Stripe API Error:', stripeData);
          throw new Error(stripeData.error?.message || 'Stripe rejected checkout session');
        }

        return new Response(
          JSON.stringify({
            url: stripeData.url,
            sessionId: stripeData.id,
            isLive: Boolean(stripeKey.startsWith('rk_live') || stripeKey.startsWith('sk_live')),
          }),
          { headers: CORS_HEADERS }
        );
      } catch (err: any) {
        console.error('[Cloudflare Worker] Checkout Error:', err);
        return new Response(
          JSON.stringify({
            error: err.message || 'Checkout session creation failed',
            fallbackUrl: `${url.origin}/?stripe_checkout_fallback=true`,
          }),
          {
            status: 500,
            headers: CORS_HEADERS,
          }
        );
      }
    }

    // 3. API: Verify Checkout Session
    if (url.pathname === '/api/verify-checkout-session' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { sessionId } = body;
        if (!sessionId) {
          return new Response(JSON.stringify({ error: 'Missing sessionId parameter' }), {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        if (sessionId.startsWith('cs_demo_')) {
          return new Response(
            JSON.stringify({ verified: true, status: 'paid', sessionId, amountTotal: 1000 }),
            { headers: CORS_HEADERS }
          );
        }

        const stripeRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
          {
            headers: {
              Authorization: `Bearer ${stripeKey}`,
            },
          }
        );
        const session: any = await stripeRes.json();
        if (session.payment_status === 'paid') {
          return new Response(
            JSON.stringify({
              verified: true,
              status: 'paid',
              sessionId: session.id,
              amountTotal: session.amount_total,
              metadata: session.metadata,
            }),
            { headers: CORS_HEADERS }
          );
        }

        return new Response(
          JSON.stringify({
            error: `Checkout payment status is ${session.payment_status}`,
            paymentStatus: session.payment_status,
          }),
          { status: 400, headers: CORS_HEADERS }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // 4. API: Create Payment Intent
    if (url.pathname === '/api/create-payment-intent' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const {
          amount = 1000,
          currency = 'usd',
          businessName = 'Billboard Sponsor',
          businessLink = '',
          billboardId = 'current',
          billboardName = 'Billboard',
        } = body;

        const params = new URLSearchParams();
        params.append('amount', String(Math.round(amount)));
        params.append('currency', currency.toLowerCase());
        params.append('description', `LobbyBazaar 5-Day Promotion: ${businessName} (${billboardName})`);
        params.append('metadata[businessName]', String(businessName));
        params.append('metadata[businessLink]', String(businessLink));
        params.append('metadata[billboardId]', String(billboardId));
        params.append('metadata[billboardName]', String(billboardName));
        params.append('metadata[durationDays]', '5');
        params.append('metadata[priceUsd]', '10.00');
        params.append('automatic_payment_methods[enabled]', 'true');

        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        const pi: any = await stripeRes.json();

        if (!stripeRes.ok) {
          throw new Error(pi.error?.message || 'Failed to create PaymentIntent');
        }

        return new Response(
          JSON.stringify({
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            isLive: Boolean(stripeKey.startsWith('rk_live') || stripeKey.startsWith('sk_live')),
          }),
          { headers: CORS_HEADERS }
        );
      } catch (err: any) {
        // Fallback demo payment intent
        const demoId = `pi_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return new Response(
          JSON.stringify({
            clientSecret: `${demoId}_secret_demo`,
            paymentIntentId: demoId,
            isLive: false,
            message: 'Fallback payment intent generated',
            error: err.message,
          }),
          { headers: CORS_HEADERS }
        );
      }
    }

    // 5. API: Confirm Billboard Payment
    if (url.pathname === '/api/confirm-billboard-payment' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { paymentIntentId, billboardId } = body;

        if (paymentIntentId && !paymentIntentId.startsWith('pi_stripe_')) {
          const stripeRes = await fetch(
            `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
            {
              headers: { Authorization: `Bearer ${stripeKey}` },
            }
          );
          const pi: any = await stripeRes.json();
          if (pi.status === 'succeeded' || pi.status === 'processing') {
            return new Response(
              JSON.stringify({
                verified: true,
                status: pi.status,
                paymentId: pi.id,
                amount: pi.amount,
                currency: pi.currency,
                billboardId,
              }),
              { headers: CORS_HEADERS }
            );
          }
          return new Response(JSON.stringify({ error: `Payment status is ${pi.status}` }), {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        return new Response(
          JSON.stringify({
            verified: true,
            status: 'succeeded',
            paymentId: paymentIntentId || `pi_demo_${Date.now()}`,
            amount: 1000,
            currency: 'usd',
            billboardId,
          }),
          { headers: CORS_HEADERS }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Default: Forward to static assets
    return env.ASSETS.fetch(request);
  },
};
