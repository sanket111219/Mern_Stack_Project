import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getSubscribedChannels,
  getUserChannelSubscribers,
} from "../controllers/subscription.controller.js";

const router = Router();

// router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(verifyJwt, getUserChannelSubscribers)
  .post(verifyJwt, toggleSubscription);

router.route("/u/:subscriberId").get(verifyJwt, getSubscribedChannels);


export default router;