import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.isUser.js";
import { verifyJWTCUser } from "../middlewares/auth.isCuser.js";
import { uploadFields } from "../config/uploadFeilds.js";
import { registerUser, loginUser, logout, getAllUsers, changeUserPassword, getUserProfile, completeUserProfile, refreshAccessToken} from "../controllers/user.controllers.js"

const router = Router();



router
    .route("/register").post(registerUser);

router
    .route("/login").post(loginUser);

router
    .route("/logout").post(verifyJWT, logout);

router
    .route("/changepassword").patch(verifyJWT, changeUserPassword);
    
router
    .route("/getuserprofile").get(verifyJWT, getUserProfile);

router
    .route("/completeuserprofile").patch(verifyJWT, uploadFields, completeUserProfile);


router
    .route("/refreshaccesstoken").patch(refreshAccessToken)

router
    .route("/all").get(verifyJWTCUser, getAllUsers)



export default router;