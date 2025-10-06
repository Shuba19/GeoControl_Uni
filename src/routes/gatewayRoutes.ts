import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType"
import {
  createGateway,
  deleteGateway,
  getNetworkGateway,
  getSingleGatewayByMacAdd,
  updateGateway
} from "../controllers/gatewayController"
import { GatewayFromJSON } from "@models/dto/Gateway";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";
import { parseJSON } from "date-fns";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get(""  ,
     authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
  async (req, res, next) => {
    try {
      res.status(200).json(await getNetworkGateway(req.params["networkCode"]))
    } catch (error) {
      next(error)
    }
  });

// Create a new gateway (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const gwJSON = GatewayFromJSON(req.body);
      if (!gwJSON.macAddress || !gwJSON.name || !gwJSON.description) {
        throw new BadRequest({path:"macAddress and name are required fields"});
      }
      await createGateway(GatewayFromJSON(req.body), req.params["networkCode"]);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  });

// Get a specific gateway (Any authenticated user)
router.get("/:gatewayMac",
  authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
async (req, res, next) => {
  try {
    res.status(200).json(await getSingleGatewayByMacAdd(req.params.gatewayMac, req.params.networkCode));
  } catch (error) {
    next(error)
  }
});

// Update a gateway (Admin & Operator)
router.patch("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {    
      const gwJSON = GatewayFromJSON(req.body);
      if (!gwJSON.macAddress || !gwJSON.name || !gwJSON.description) {
        throw new BadRequest({path:"macAddress and name are required fields"});
      }
      await updateGateway(req.params.gatewayMac, GatewayFromJSON(req.body), req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }

  });

// Delete a gateway (Admin & Operator)
router.delete("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteGateway(req.params.gatewayMac, req.params.networkCode);
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
