import { Router } from "express";
import { verifyJWTCUser } from "../middlewares/auth.isCuser.js";
import { uploadFeildsCUser } from "../config/uploadFeildsCuser.js";
import { registerCUser, loginCUser, getAllCDirectors, logoutCUser, getCUserProfile, changeCUserPassword, updateCUserProfile, refreshAccessToken } from "../controllers/cuser.controllers.js";
import { verifyJWT } from "../middlewares/auth.isUser.js";

const router = Router();

router
    .route("/register").post(registerCUser);

router
    .route("/login").post(loginCUser);

router
    .route("/logout").post(verifyJWTCUser, logoutCUser);

router
    .route("/profile").get(verifyJWTCUser, getCUserProfile);

router
    .route("/changepassword").patch(verifyJWTCUser, changeCUserPassword);

router
    .route("/updateprofile").patch(verifyJWTCUser, uploadFeildsCUser, updateCUserProfile);

router
    .route("/refreshaccesstoken").patch(refreshAccessToken);

router
    .route("/all").get(verifyJWT, getAllCDirectors);





export default router;