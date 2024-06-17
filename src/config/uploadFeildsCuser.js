import { upload } from "../middlewares/multer.js";

export const uploadFeildsCUser = upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerPic', maxCount: 1 },
])