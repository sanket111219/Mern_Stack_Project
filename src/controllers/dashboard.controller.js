import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const data = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
        totalVideos: {
          $sum: 1,
        },
        totaLikes: {
          $sum: "$likes",
        },
      },
    },
    {
      $addFields: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "totalSubscribers",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$totalSubscribers",
        },
      },
    },
    {
      $project: {
        _id: 0,
        owner: 0,
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, data, "Get channel stats success"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "duration",
    sortType = "desc",
  } = req.query;
  // TODO: Get all the videos uploaded by the channel
  let videoQuery = {};
  videoQuery.$match = {
    owner: new mongoose.Types.ObjectId(req.user?._id),
    isPublished: true,
  };
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  if (sortBy && sortType) {
    options.sort = {
      [sortBy]: sortType === "asc" ? 1 : -1,
    };
  }
  const aggregateModel = Video.aggregate([
    videoQuery,
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  const videos = await Video.aggregatePaginate(aggregateModel, options)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      throw new ApiError(500, error.message || "Error in fetching videos");
    });

  if (!videos) {
    throw new ApiError(500, "Failed to fetch videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Get channel videos success"));
});

export { getChannelStats, getChannelVideos };
