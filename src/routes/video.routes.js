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

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(verifyJwt, deleteVideo)
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJwt, togglePublishStatus);

router
  .route("/")
  .get(getAllVideos)
  .post(
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
