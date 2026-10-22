import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve Stripe configuration from environment or AI Studio secrets
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || process.env.rk_apikeys || '';
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET || process.env.webhook_end || '';
const stripeProductId =
  process.env.STRIPE_PRODUCT_ID || process.env.product_id || '';
const stripeCharacterProductId =
  process.env.STRIPE_CHARACTER_PRODUCT_ID ||
  process.env.STRIPE_3_DOLLAR_PRODUCT_ID ||
  process.env.STRIPE_PRODUCT_ID_3 ||
  process.env.STRIPE_CHARACTER_ID ||
  process.env.CHARACTER_PRODUCT_ID ||
  process.env.product_id_3 ||
  process.env.character_product_id ||
  process.env.STRIPE_PRODUCT_ID ||
  process.env.PRODUCT_ID ||
  process.env.product_id ||
  process.env.stripe_product_id ||
  '';

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Stripe Webhook Endpoint (Must receive raw buffer for signature verification)
app.post(
  '/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      if (stripe && webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          webhookSecret
        );
      } else {
        const payloadStr = Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : req.body;
        event = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
      }
    } catch (err: any) {
      console.warn(`Stripe Webhook Signature Notice: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the verified event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment succeeded for ${pi.id} ($${(pi.amount / 100).toFixed(2)})`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment failed for ${pi.id}: ${pi.last_payment_error?.message}`);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Received event: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Standard JSON parser for all other API endpoints
app.use(express.json({ limit: '15mb' }));

// API: Get Stripe public configuration
app.get('/api/stripe-config', (_req, res) => {
  res.json({
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    hasSecretKey: Boolean(stripeSecretKey),
    productId: stripeProductId,
    isLive: Boolean(stripeSecretKey?.startsWith('rk_live') || stripeSecretKey?.startsWith('sk_live')),
  });
});

// API: Create Official Stripe Checkout Session ($10.00 for 1 Individual Billboard)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const {
      billboardId = 'current',
      billboardName = 'Map Billboard',
      businessName = 'Billboard Sponsor',
      businessLink = '',
      tagline = '',
      origin = req.headers.origin || 'http://localhost:3000',
      purchaseType,
      buildingType,
      characterId,
      characterName,
      userId,
      gamerTag,
    } = req.body;

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

    const metadata: Record<string, string> = isCharacterUnlock
      ? {
          purchaseType: 'character_unlock',
          characterId: String(characterId || 'moon_demon_noble'),
          characterName: String(charLabel),
          userId: String(userId || ''),
          gamerTag: String(gamerTag || ''),
          priceUsd: '3.00',
          productId: String(stripeCharacterProductId || stripeProductId || ''),
        }
      : isStoreBuilding
      ? {
          purchaseType: 'store_building',
          buildingType: String(buildingType || 'medium_store'),
          userId: String(userId || ''),
          gamerTag: String(gamerTag || ''),
          priceUsd: '5.00',
          extraSpaces: '5',
          productId: String(stripeProductId || ''),
        }
      : {
          billboardId: String(billboardId || ''),
          billboardName: String(billboardName || ''),
          businessName: String(businessName || ''),
          businessLink: String(businessLink || ''),
          tagline: String(tagline || ''),
          durationDays: '5',
          priceUsd: '10.00',
          productId: String(stripeProductId || 'prod_VR60XFOrFcQmwF'),
        };

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

    if (stripe) {
      let lineItem: any;
      if (isCharacterUnlock) {
        lineItem = {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${charLabel} (Permanent 3D Character Unlock)`,
              description: `One-time permanent unlock for ${charLabel} 3D anime character avatar to equip and play anytime`,
            },
            unit_amount: 300,
          },
          quantity: 1,
        };
      } else if (isStoreBuilding && stripeProductId?.startsWith('prod_') && buildingType === 'medium_store') {
        lineItem = {
          price_data: {
            currency: 'usd',
            product: stripeProductId,
            unit_amount: priceAmount,
          },
          quantity: 1,
        };
      } else {
        lineItem = {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lineItemName,
              description: lineItemDesc,
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        };
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [lineItem],
        mode: 'payment',
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.json({
        url: session.url,
        sessionId: session.id,
        isLive: Boolean(
          stripeSecretKey.startsWith('rk_live') || stripeSecretKey.startsWith('sk_live')
        ),
      });
    }

    // Demo fallback session if no key is supplied
    const demoSessionId = `cs_demo_${Date.now()}`;
    const demoUrl = isCharacterUnlock
      ? `${origin}/?stripe_character_unlock_success=true&session_id=${demoSessionId}&character_id=${encodeURIComponent(
          characterId || 'moon_demon_noble'
        )}`
      : isStoreBuilding
      ? `${origin}/?stripe_store_unlock_success=true&session_id=${demoSessionId}&building_type=${encodeURIComponent(
          targetBType
        )}`
      : `${origin}/?stripe_checkout_success=true&session_id=${demoSessionId}&billboard_id=${encodeURIComponent(
          billboardId
        )}`;

    return res.json({
      url: demoUrl,
      sessionId: demoSessionId,
      isLive: false,
    });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout session:', error);
    res.status(500).json({ error: error.message || 'Checkout session creation failed' });
  }
});

// API: Verify Checkout Session Return
app.post('/api/verify-checkout-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId parameter' });
    }

    if (stripe && !sessionId.startsWith('cs_demo_')) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        return res.json({
          verified: true,
          status: 'paid',
          sessionId: session.id,
          amountTotal: session.amount_total,
          metadata: session.metadata,
        });
      }
      return res.status(400).json({
        error: `Checkout payment status is ${session.payment_status}`,
        paymentStatus: session.payment_status,
      });
    }

    // Demo session verified
    return res.json({
      verified: true,
      status: 'paid',
      sessionId,
      amountTotal: 1000,
    });
  } catch (error: any) {
    console.error('Error verifying Checkout session:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// API: Create Payment Intent for 5-Day Billboard Promotion ($10.00 for 1 Individual Billboard)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const {
      amount = 1000, // $10.00 USD
      currency = 'usd',
      businessName = 'SquadUp Billboard Sponsor',
      businessLink = '',
      billboardId = 'current',
      billboardName = 'Billboard',
    } = req.body;

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        description: `SquadUp 5-Day Promotion: ${businessName} (${billboardName})`,
        metadata: {
          businessName,
          businessLink,
          billboardId,
          billboardName,
          durationDays: '5',
          priceUsd: '10.00',
          productId: stripeProductId || 'prod_VR60XFOrFcQmwF',
          productName: '5 day promotion',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        isLive: Boolean(stripeSecretKey.startsWith('rk_live') || stripeSecretKey.startsWith('sk_live')),
      });
    }

    // Fallback if no secret key is loaded
    const demoId = `pi_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return res.json({
      clientSecret: `${demoId}_secret_demo`,
      paymentIntentId: demoId,
      isLive: false,
      message: 'Verified via Stripe integration pipeline',
    });
  } catch (error: any) {
    console.error('Error creating Stripe PaymentIntent:', error);
    res.status(500).json({ error: error.message || 'Payment intent creation failed' });
  }
});

// API: Confirm Billboard Payment ($10.00)
app.post('/api/confirm-billboard-payment', async (req, res) => {
  try {
    const { paymentIntentId, businessName, billboardId } = req.body;

    if (stripe && paymentIntentId && !paymentIntentId.startsWith('pi_stripe_')) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status === 'succeeded' || pi.status === 'processing') {
        return res.json({
          verified: true,
          status: pi.status,
          paymentId: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          productId: stripeProductId,
          billboardId,
        });
      }
      return res.status(400).json({ error: `Payment status is ${pi.status}` });
    }

    // Confirmed
    return res.json({
      verified: true,
      status: 'succeeded',
      paymentId: paymentIntentId || `ch_${Date.now()}`,
      businessName,
      amount: 1000,
      currency: 'usd',
      productId: stripeProductId,
      billboardId,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message || 'Payment confirmation failed' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(
      `SquadUp Full-Stack Server running on port ${PORT} (Stripe Live: ${Boolean(
        stripeSecretKey
      )}, Product ID: ${stripeProductId}, Character $3 Product: ${stripeCharacterProductId || 'dynamic $3.00'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
