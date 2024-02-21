import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel id");
    }

    const exsistingSubscription = await Subscription.findOne({
      subscriber: req.user._id,
      channel: new mongoose.Types.ObjectId(channelId),
    });

    if (exsistingSubscription) {
      await Subscription.findByIdAndDelete(exsistingSubscription._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    } else {
      const channel = await Subscription.create({
        subscriber: req.user._id,
        channel: new mongoose.Types.ObjectId(channelId),
      });

      if (!channel) {
        throw new ApiError(500, "Something went wrong while subscribing");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, { channel }, "Subscribed successfully"));
    }
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while subscribing"
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $project: {
                _id: 1,
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          subscriber: {
            $first: "$subscriber",
          },
        },
      },
      {
        $project: {
          subscriber: 1,
        },
      },
    ]);

    if (!subscribers) {
      throw new ApiError(
        500,
        "Something went wrong while fetching subscribers"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribers },
          "Subscribers fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching subscribers"
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Invalid subscriber id");
    }

    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: {
                _id: 1,
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          channel: {
            $first: "$channel",
          },
        },
      },
      {
        $project: {
          channel: 1,
        },
      },
    ]);

    if (!subscribedChannels) {
      throw new ApiError(
        500,
        "Something went wrong while fetching subscribed channels"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribedChannels },
          "Subscribed channels fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching subscribed channels"
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
