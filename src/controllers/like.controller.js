import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    const likedBy = req.user._id;

    const likedVideo = await Like.findOne({
      likedBy,
      video: videoId,
    });

    if (likedVideo) {
      await Like.findByIdAndDelete(likedVideo._id);
      return res.status(201).json(new ApiResponse(200, {}, "Video unliked"));
    } else {
      const newLike = await Like.create({
        likedBy,
        video: videoId,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, { newLike }, "Video liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Failed to like video");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    //TODO: toggle like on video
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }
    const likedBy = req.user._id;

    const likedComment = await Like.findOne({
      likedBy,
      comment: commentId,
    });

    if (likedComment) {
      await Like.findByIdAndDelete(likedComment._id);
      return res.status(200).json(new ApiResponse(200, {}, "comment unliked"));
    } else {
      const newLike = await Like.create({
        likedBy,
        comment: commentId,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, { newLike }, "comment liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Failed to like comment");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid tweet id");
    }
    const likedBy = req.user._id;

    const likedTweet = await Like.findOne({
      likedBy,
      tweet: tweetId,
    });

    if (likedTweet) {
      await Like.findByIdAndDelete(likedTweet._id);
      return res.status(201).json(new ApiResponse(200, {}, "tweet unliked"));
    } else {
      const newLike = await Like.create({
        likedBy,
        tweet: tweetId,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, { newLike }, "tweet liked"));
    }
  } catch (error) {
    throw new ApiError(500, "Failed to like tweet");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedBy = req.user._id;
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              title: 1,
              description: 1,
              videoFile: 1,
              thumbnail: 1,
              duration: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $arrayElemAt: ["$video", 0] },
      },
    },
    {
      $project: {
        likedBy: 1,
        video: 1,
      },
    },
  ]);

  if (!likedVideos.length)
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked videos found"));
  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos found"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
