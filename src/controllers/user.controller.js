import { asyncHandler } from "../utils/asyncHandler.js";

const registeUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Ok",
  });
});

export { registeUser };
