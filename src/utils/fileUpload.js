import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, type = 0) => {
  if (type) {
    try {
      if (!localFilePath) return null;
      //upload file on cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          localFilePath,
          {
            resource_type: "auto",
            chunk_size: 6000000,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
      // file has been uploaded successfully
      // console.log("file is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath);
      return result;
    } catch (error) {
      fs.unlinkSync(localFilePath); // remove locally tempory file as upload operation got failed
      return null;
    }
  } else {
    try {
      if (!localFilePath) return null;
      //upload file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });
      // file has been uploaded successfully
      // console.log("file is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath);
      return response;
    } catch (error) {
      fs.unlinkSync(localFilePath); // remove locally tempory file as upload operation got failed
      return null;
    }
  }
};

export default uploadOnCloudinary;
