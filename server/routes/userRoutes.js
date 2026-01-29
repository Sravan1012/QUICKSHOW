import express from "express";
import {
  getFavourites,
  getUserBookings,
  updateFavourite,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/bookings", getUserBookings);
userRouter.post("/update-favourite", updateFavourite);
userRouter.get("/favourites", getFavourites);

export default userRouter;
