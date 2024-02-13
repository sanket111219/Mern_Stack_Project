import { Router } from "express";
import {
  logOutUser,
  loginUser,
  registeUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registeUser
);

router.route("/login").post(
  upload.any(),
  loginUser);

//secured routes
router.route("/logout").post(verifyJwt, logOutUser);

export default router;
