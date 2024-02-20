import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/fileUpload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if (!query && !userId) {
    throw new ApiError(
      400,
      "search keyword is not provided or userId not provided"
    );
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
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { userId: new mongoose.Types.ObjectId(userId) },
        ],
        isPublished: true,
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

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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

  const { title, description } = req.body;
  const thumbnailFilePath = req.file?.path;
  if (thumbnailFilePath) {
    const thumbnail = await uploadOnCloudinary(thumbnailFilePath);
    if (!thumbnail) throw new ApiError(500, "Error in uploading thumbnail");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  if (!video) throw new ApiError(404, "Video not found");

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnail) video.thumbnail = thumbnail.url;

  const updateVideo = await video.save({ validateBeforeSave: false });

  if (!updateVideo) throw new ApiError(500, "Error in updating video");
  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
