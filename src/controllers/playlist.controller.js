import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  if (!name) throw new ApiError(400, "Name is required");
  if (!description) throw new ApiError(400, "Description is required");

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) throw new ApiError(500, "Failed to create playlist");
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
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
          ],
        },
      },
    ]);

    if (!playlists) throw new ApiError(500, "Failed to fetch user playlists");
    return res
      .status(200)
      .json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong fetching user playlists"
    );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId))
      throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
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
          ],
        },
      },
    ]);

    if (!playlist) throw new ApiError(500, "Failed to fetch playlist");
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong fetching playlist"
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(
        403,
        "You are not authorized to add video to this playlist"
      );
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (!video.owner.equals(req.user._id)) {
      throw new ApiError(
        403,
        "You are not authorized to add this video to playlist"
      );
    }

    if (playlist.video.includes(videoId)) {
      throw new ApiError(400, "Video already in playlist");
    }
    playlist.video.push(videoId);
    await playlist.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video added to playlist successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to add video to playlist");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(
        403,
        "You are not authorized to remove video from this playlist"
      );
    }

    if (!playlist.video.includes(videoId)) {
      throw new ApiError(400, "Video not in playlist");
    }
    playlist.video.pull(videoId);
    await playlist.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Video removed from playlist successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Failed to remove video from playlist"
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to delete playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name && !description)
      throw new ApiError(400, "Name or description is required");
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to update this playlist");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to update playlist");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
