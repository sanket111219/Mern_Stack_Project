import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const aggregateModel = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
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
              $project: {
                _id: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $arrayElemAt: ["$owner", 0],
          },
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: {
            $size: "$likes",
          },
        },
      },
    ]);

    const comments = await Comment.aggregatePaginate(aggregateModel, options)
      .then((result) => {
        return result;
      })
      .catch((error) => {
        throw new ApiError(
          500,
          "Something went wrong when fetching video comments"
        );
      });

    return res
      .status(201)
      .json(
        new ApiResponse(200, { comments }, "Comments fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong when fetching video comments outside try block"
    );
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }

    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Comment is required");
    }

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { comment }, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong when adding comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Comment is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.content = content;
    await comment.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, { comment }, "Comment updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong when updating comment"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong when deleting comment"
    );
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
