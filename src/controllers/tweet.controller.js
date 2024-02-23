import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const owner = req.user._id;

  if (!content) throw new ApiError(400, "Content is required");

  const newTweet = await Tweet.create({
    content,
    owner,
  });

  if (!newTweet) throw new ApiError(500, "Failed to create tweet");

  return res
    .status(201)
    .json(new ApiResponse(201, { newTweet }, "Tweet created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        content: 1,
        likesCount: 1,
      },
    },
  ]);

  if (!userTweets) throw new ApiError(404, "User tweets not found");

  return res
    .status(200)
    .json(new ApiResponse(200, { userTweets }, "User tweets found"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const owner = req.user._id;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (!tweet.owner.equals(owner)) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  tweet.content = content;
  await tweet.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, { tweet }, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const owner = req.user._id;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");

  if (!tweet.owner.equals(owner)) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
