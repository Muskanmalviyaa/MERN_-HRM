import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import attendanceRouter from "./attendance";
import overtimeRouter from "./overtime";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(attendanceRouter);
router.use(overtimeRouter);
router.use(reportsRouter);

export default router;
