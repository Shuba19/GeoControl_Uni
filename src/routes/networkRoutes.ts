import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createNetwork,
  deleteNetwork,
  getAllNetworks,
  getSingleNetworkByMacAdd,
  updateNetwork,
} from "../controllers/networkController";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";
import { NetworkFromJSON } from "@dto/Network";
const router = Router();


// Get all networks (Any authenticated user)
router.get("", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
      res.status(200).json(await getAllNetworks());
    } catch (error) {
      next(error);
    }
});

// Create a new network (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const netJSON = NetworkFromJSON(req.body);
    if (!netJSON.code || !netJSON.name || !netJSON.description) {
      throw new BadRequest({path:"code and name are required fields"});
    }
    await createNetwork(netJSON);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});


// Get a specific network (Any authenticated user)
router.get(
  "/:networkCode", 
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
  async (req, res, next) => {
  try {
      res.status(200).json(await getSingleNetworkByMacAdd(req.params.networkCode));
    } catch (error) {
      next(error);
    }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const netJSON = NetworkFromJSON(req.body);
    if (!netJSON.code || !netJSON.name || !netJSON.description) {
      throw new BadRequest({path:"code and name are required fields"});
    }
    await updateNetwork(req.params.networkCode, netJSON);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a network (Admin & Operator)
router.delete("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
      await deleteNetwork(req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
});

//405 errors
router.patch("", authenticateUser([UserType.Admin, UserType.Operator]),
async (req, res, next) => {
  try {
    throw new AppError("Method not allowed", 405);
  } catch (error) {
    next(error);
  }
});

router.delete("", authenticateUser([UserType.Admin, UserType.Operator]),
async (req, res, next) => {
  try {
    throw new AppError("Method not allowed", 405);
  } catch (error) {
    next(error);
  }
});
export default router;


