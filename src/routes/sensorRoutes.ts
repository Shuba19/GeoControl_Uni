import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType"
import {
  createSensor,
  deleteSensor,
  getSensorByGatewayMacAddress,
  getSingleSensorByMacAddress,
  updateSensor
} from "../controllers/sensorController"
import { SensorFromJSON } from "@models/dto/Sensor";

const router = Router({ mergeParams: true });

// Get all sensors (Any authenticated user)
router.get(""  ,
     authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), 
  async (req, res, next) => {
    try {
      res.status(200).json(await getSensorByGatewayMacAddress(req.params["gatewayMac"], req.params["networkCode"]))
    } catch (error) {
      next(error)
    }
  });

// Create a new sensor (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const sensorJSON = SensorFromJSON(req.body);
      if (!sensorJSON.macAddress || !sensorJSON.name || !sensorJSON.description || !sensorJSON.variable || !sensorJSON.unit) {
        throw new AppError("Invalid input Data", 400);
      }
      await createSensor(SensorFromJSON(req.body), req.params["gatewayMac"], req.params["networkCode"]);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  });

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    
    res.status(200).json(await getSingleSensorByMacAddress(req.params.sensorMac,req.params["networkCode"], req.params["gatewayMac"]));
  } catch (error) {
    next(error)
  }
});

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const sensorJSON = SensorFromJSON(req.body);
      if (!sensorJSON.macAddress || !sensorJSON.name || !sensorJSON.description || !sensorJSON.variable || !sensorJSON.unit) {
        throw new AppError("Invalid input Data", 400);
      }
      await updateSensor(req.params.sensorMac, SensorFromJSON(req.body), req.params.gatewayMac, req.params.networkCode);
      res.status(204).send();
    } catch (error) {
      next(error);
    }

  });

// Delete a sensor (Admin & Operator)
router.delete("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => { 
    try {
      await deleteSensor(req.params.sensorMac, req.params.networkCode, req.params.gatewayMac);
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
