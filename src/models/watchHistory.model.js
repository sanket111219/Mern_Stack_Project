import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        watchedAt: {
            type: Date,
            default: Date.now,
        },
    }, 
    {
        timestamps: true,
    }
    );

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);