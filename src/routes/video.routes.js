import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
} from "../controllers/video.controller.js";

const router = Router();


router.route("/get-videos").get(getAllVideos);

//secure routes
router.route("/publish-video").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

export default router;
