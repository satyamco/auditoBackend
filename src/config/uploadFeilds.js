import { upload } from "../middlewares/multer.js";

export const uploadFields = upload.fields([
    { name: 'profilePic'},
    { name: 'introVideo'},
    { name: 'photos'},
    { name: 'monologVideo'}
  ]);