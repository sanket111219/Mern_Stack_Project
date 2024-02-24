import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/fileUpload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "duration",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if (!query && !userId) {
    throw new ApiError(
      400,
      "search keyword is not provided or userId not provided"
    );
  }
  let videoQuery = {};
  if (query && !userId) {
    videoQuery.$match = {
      $or: [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ],
      isPublished: true,
    };
  } else if (userId && !query) {
    videoQuery.$match = {
      owner: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    };
  } else if (query && userId) {
    videoQuery.$match = {
      $or: [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ],
      owner: new mongoose.Types.ObjectId(userId),
      isPublished: true,
    };
  } else {
    matchStage["$match"] = {};
  }

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
    throw new ApiError(500, "Videos query not working properly");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title) {
    throw new ApiError(400, "Title is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  const videoFilePath = req.files?.video[0]?.path;
  console.log(videoFilePath);
  if (!videoFilePath) {
    throw new ApiError(400, "Video file not provided");
  }

  const thumbnailFilePath = req.files?.thumbnail[0]?.path;
  if (!thumbnailFilePath) {
    throw new ApiError(400, "Thumbnail file not provided");
  }

  const video = await uploadOnCloudinary(videoFilePath, 1);
  if (!video) {
    throw new ApiError(500, "Error in uploading video");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailFilePath);

  if (!thumbnail) throw new ApiError(500, "Error in uploading thumbnail");

  const newVideo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    duration: video.duration,
    isPublished: true,
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!newVideo) throw new ApiError(500, "Error in creating video");

  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const videoUpdate = await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });

  if(!videoUpdate) throw new ApiError(500, "Error in updating video views");
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },

        likesCount: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!video) throw new ApiError(404, "Video not found");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const { title, description } = req.body;
  const thumbnailFilePath = req.file?.path;
  const thumbnail = null;
  if (thumbnailFilePath) {
    thumbnail = await uploadOnCloudinary(thumbnailFilePath);
    if (!thumbnail) throw new ApiError(500, "Error in uploading thumbnail");
  }

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnail) video.thumbnail = thumbnail.url;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(404, "Video not found");

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  //   if (!deletedVideo) throw new ApiError(500, "Error in deleting video");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(404, "Video not found");
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video },
        "Video publish status updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
