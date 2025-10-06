import { CONFIG } from "@config";
import { Router } from "express";
import * as measurementController from "@controllers/measurementController";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { MeasurementFromJSON } from "@dto/Measurement";
import { BadRequest } from "express-openapi-validator/dist/openapi.validator";
import { parseISODateParamToUTC } from "@utils";
const router = Router();
//okay
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      const sensorMac = req.params.sensorMac;
      for(const key in req.body) {
        const value = req.body[key].value;
        const createdAt = req.body[key].createdAt;
        
      if(parseISODateParamToUTC(createdAt) == undefined )
        {
          throw new BadRequest({path:"createdAt must be a valid date"});
        }
        if(isNaN(value)) {
          throw new BadRequest({path:"type must be correct"});
        }
        await measurementController.createSensorMeasurement(
          networkCode,
          gatewayMac,
          sensorMac,
          {
            createdAt: createdAt,
            value: value
          }
        );
      }
      
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);
//okay
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser(),
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const result = await measurementController.getSensorMeasurements(
        req.params.networkCode,
        req.params.gatewayMac,
        req.params.sensorMac,
        startDate,
        endDate
      );      
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats",
  authenticateUser(),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      const sensorMac = req.params.sensorMac;      
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const result = await measurementController.getSensorStats(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers",
  authenticateUser(),
  async (req, res, next) => {

    try {
      const networkCode = req.params.networkCode;
      const gatewayMac = req.params.gatewayMac;
      const sensorMac = req.params.sensorMac;
      
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const result = await measurementController.getSensorOutliers(
        networkCode,
        gatewayMac,
        sensorMac,
        startDate,
        endDate
      );
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);



//network measurements

//okay
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements",
  authenticateUser(),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const sensorMac = req.query.sensorMacs;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      let sensorMacList: string[] | undefined;
      if (sensorMac) {
        if (Array.isArray(sensorMac)) {
          sensorMacList = sensorMac as string[];
        } else {
          sensorMacList = (sensorMac as string).split(',');
        }
      }
      const result = await measurementController.getNetworkMeasurements(
        networkCode,
        sensorMacList,
        startDate,
        endDate
      );      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats",
  authenticateUser(),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const sensorMac = req.query.sensorMacs ;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      let sensorMacList: string[] | undefined;
      if (sensorMac) {
        if (Array.isArray(sensorMac)) {
          sensorMacList = sensorMac as string[];
        } else {
          sensorMacList = (sensorMac as string).split(',');
        }
      }
      const result = await measurementController.getNetworkStats(networkCode,sensorMacList, startDate, endDate);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
//okay tested
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers",
  authenticateUser(),
  async (req, res, next) => {
    try {
      const networkCode = req.params.networkCode;
      const sensorMac = req.query.sensorMacs;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      let sensorMacList: string[] | undefined;
      if (sensorMac) {
        if (Array.isArray(sensorMac)) {
          sensorMacList = sensorMac as string[];
        } else {
          sensorMacList = (sensorMac as string).split(',');
        }
      }
      const result = await measurementController.getNetworkOutliers(networkCode,sensorMacList, startDate, endDate);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
