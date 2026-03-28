import express from "express";
import { merchantService } from "../services/merchantService.js";
import {
  registerMerchantZodSchema,
  sessionBrandingSchema,
  webhookSettingsSchema,
} from "../lib/request-schemas.js";
import { z } from "zod";

const router = express.Router();

const rotateWebhookSecretSchema = z.object({
  grace_period_hours: z.number().int().min(0).max(168).optional(),
});

const rotateApiKeySchema = z.object({
  grace_period_hours: z.number().int().min(0).max(168).optional(),
});

const setApiKeyExpirySchema = z.object({
  expires_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
});

/**
 * @swagger
 * /api/register-merchant:
 *   post:
 *     summary: Register a new merchant
 *     tags: [Merchants]
 */
router.post("/register-merchant", async (req, res, next) => {
  try {
    const body = registerMerchantZodSchema.parse(req.body || {});
    const merchant = await merchantService.registerMerchant(body);

    res.status(201).json({
      message: "Merchant registered successfully",
      merchant
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/rotate-key:
 *   post:
 *     summary: Rotate the authenticated merchant's API key
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/rotate-key", async (req, res, next) => {
  try {
    const result = await merchantService.rotateApiKey(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/merchants/rotate-api-key:
 *   post:
 *     summary: Rotate API key with overlap period for seamless migration
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grace_period_hours:
 *                 type: integer
 *                 description: Hours the old key remains valid (0-168, default 24)
 *                 default: 24
 *     responses:
 *       200:
 *         description: New API key generated with old key overlap period
 */
router.post("/merchants/rotate-api-key", async (req, res, next) => {
  try {
    const body = rotateApiKeySchema.parse(req.body || {});
    const result = await merchantService.rotateApiKey(
      req.merchant.id,
      body.grace_period_hours
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/merchants/api-key-status:
 *   get:
 *     summary: Get current API key status and expiry information
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: API key status information
 */
router.get("/merchants/api-key-status", async (req, res, next) => {
  try {
    const result = await merchantService.getApiKeyStatus(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/merchants/set-api-key-expiry:
 *   put:
 *     summary: Set an expiry date for the current API key
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expires_at
 *             properties:
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 datetime when the API key expires
 */
router.put("/merchants/set-api-key-expiry", async (req, res, next) => {
  try {
    const body = setApiKeyExpirySchema.parse(req.body);
    const result = await merchantService.setApiKeyExpiry(
      req.merchant.id,
      body.expires_at
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/merchants/rotate-webhook-secret:
 *   post:
 *     summary: Rotate the authenticated merchant's webhook signing secret
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/merchants/rotate-webhook-secret", async (req, res, next) => {
  try {
    const body = rotateWebhookSecretSchema.parse(req.body || {});
    const result = await merchantService.rotateWebhookSecret(
      req.merchant.id,
      req.merchant.webhook_secret,
      body.grace_period_hours
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/merchant-branding", async (req, res, next) => {
  try {
    const result = await merchantService.getMerchantBranding(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/merchant-branding", async (req, res, next) => {
  try {
    const brandingConfig = sessionBrandingSchema.parse(req.body || {});
    const result = await merchantService.updateMerchantBranding(req.merchant.id, brandingConfig);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/merchant-profile", async (req, res, next) => {
  try {
    const result = await merchantService.getMerchantProfile(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/test-webhook:
 *   post:
 *     summary: Send a test ping to a webhook URL
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/test-webhook", async (req, res, next) => {
  try {
    const { webhook_url } = req.body || {};

    if (!webhook_url) {
      return res.status(400).json({ error: "webhook_url is required" });
    }

    const urlValidation = z.string().url().safeParse(webhook_url);
    if (!urlValidation.success) {
      return res.status(400).json({ error: "webhook_url must be a valid URL" });
    }

    const result = await merchantService.testWebhook(req.merchant, webhook_url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/webhook-settings:
 *   get:
 *     summary: Retrieve current webhook URL and masked webhook secret
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get("/webhook-settings", async (req, res, next) => {
  try {
    const result = await merchantService.getWebhookSettings(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/webhook-settings:
 *   put:
 *     summary: Update the merchant's webhook endpoint URL
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.put("/webhook-settings", async (req, res, next) => {
  try {
    const body = webhookSettingsSchema.parse(req.body || {});
    const result = await merchantService.updateWebhookSettings(req.merchant.id, body.webhook_url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/regenerate-webhook-secret:
 *   post:
 *     summary: Regenerate the merchant's webhook signing secret
 *     tags: [Merchants]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/regenerate-webhook-secret", async (req, res, next) => {
  try {
    const result = await merchantService.regenerateWebhookSecret(req.merchant.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
