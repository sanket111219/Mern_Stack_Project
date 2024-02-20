import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/get-videos").get(getAllVideos);
router.route("/get-video-by-id/:videoId").get(getVideoById);

//secure routes

router
  .route("/toggle-publish-status/:videoId")
  .patch(verifyJwt, togglePublishStatus);
router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);
router
  .route("/update-video/:videoId")
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);
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
