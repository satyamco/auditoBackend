import { Router } from "express";
import {verifyJWT, } from "../middlewares/auth.isUser.js";
import { verifyJWTCUser } from "../middlewares/auth.isCuser.js";
import {createNewCCall, updateCCallDetails, deleteCCall, getApplicant, getAllCCalls, applyToCCall, statusToggle} from "../controllers/ccall.controllers.js";

const router = Router();

router
    .route("/new").post(verifyJWTCUser, createNewCCall);

router
    .route("/:ccallId").patch(verifyJWTCUser, updateCCallDetails);

router
    .route("/:ccallId").delete(verifyJWTCUser, deleteCCall);

router
    .route("/aplicants/:ccallId").get(verifyJWTCUser, getApplicant);

router
    .route("/").get( verifyJWT, getAllCCalls);

router
    .route("/apply/:ccallId").patch(verifyJWT, applyToCCall)

router
    .route("/status/:ccallId").patch(verifyJWTCUser, statusToggle);
    


export default router;