import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import logger from "../utils/logger.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a Razorpay Order for subscription.
 */
export async function createOrder(req, res, next) {
  try {
    const options = {
      amount: 9900, // ₹99.00 in paise
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
    };

    // --- MOCK MODE FOR DEVELOPMENT ---
    if (env.RAZORPAY_KEY_ID === "rzp_test_placeholder") {
      logger.warn("Using Mock Razorpay Order (Placeholder keys detected)");
      const mockOrder = {
        id: "order_mock_" + Math.random().toString(36).slice(2, 11),
        amount: options.amount,
        currency: options.currency,
        key: "rzp_test_placeholder"
      };
      await User.findByIdAndUpdate(req.user.id, { razorpayOrderId: mockOrder.id });
      return res.json(mockOrder);
    }
    // ----------------------------------

    const order = await razorpay.orders.create(options);
    
    // Save order ID to user
    await User.findByIdAndUpdate(req.user.id, { razorpayOrderId: order.id });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error("Razorpay order creation failed", err);
    next(err);
  }
}

/**
 * Verifies Razorpay payment signature and upgrades user.
 */
export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // --- MOCK VERIFICATION ---
    if (razorpay_order_id && razorpay_order_id.startsWith("order_mock_")) {
      logger.warn("Processing Mock Payment Verification");
      await User.findByIdAndUpdate(req.user.id, {
        subscriptionPlan: "premium",
        razorpayPaymentId: "pay_mock_" + Math.random().toString(36).slice(2, 11),
        razorpayOrderId: razorpay_order_id,
      });
      return res.json({ ok: true, message: "Mock Subscription activated!" });
    }
    // -------------------------

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await User.findByIdAndUpdate(req.user.id, {
        subscriptionPlan: "premium",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      });

      res.json({ ok: true, message: "Subscription activated!" });
    } else {
      res.status(400).json({ ok: false, message: "Invalid payment signature" });
    }
  } catch (err) {
    logger.error("Razorpay payment verification failed", err);
    next(err);
  }
}
