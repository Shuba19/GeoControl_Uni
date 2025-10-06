import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser
} from "@controllers/userController";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";
import { UserFromJSON } from "@dto/User";

const router = Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV === "test" && req.headers["x-force-error"] === "true") {
    return next(new Error("Forced test error"));
  }
  next();
});

// Get all users (Admin only)
router.get("", authenticateUser([UserType.Admin]), async (req, res, next) => {
  try {
    res.status(200).json(await getAllUsers());
  } catch (error) {
    next(error);
  }
});

// Create user (Admin only)
router.post("", authenticateUser([UserType.Admin]), async (req, res, next) => {
  try {
    const userJSON = UserFromJSON(req.body);
        if (!userJSON.username || !userJSON.password || !userJSON.type) {
          throw new BadRequest({path:"username, password and type are required fields"});
        }
    await createUser(UserFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get user by username (Admin only)
router.get(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      res.status(200).json(await getUser(req.params.userName));
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (Admin only)
router.delete(
  "/:userName",
  authenticateUser([UserType.Admin]),
  async (req, res, next) => {
    try {
      await deleteUser(req.params.userName);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
