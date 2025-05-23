import express from 'express';
import { 
  getAllDepartments, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentQueue,
  joinDepartmentQueue,
  updateVisitStatus,
  createVisitMemo,
  getVisitMemoById,
  updateVisitMemo,
  getAllTests,
  createTest,
  updateTest,
  deleteTest,
  getTestsByDepartment,
  getUserMemos,
  markMemoAsRead,
  getAllVisitMemos
} from '../controllers/departmentController.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';

const departmentRouter = express.Router();

// Department management routes
departmentRouter.get("/list", getAllDepartments);
departmentRouter.get("/:id", getDepartmentById);
departmentRouter.post("/create", createDepartment);
departmentRouter.put("/update/:id", updateDepartment);
departmentRouter.delete("/delete/:id", deleteDepartment);

// Queue management routes
departmentRouter.get("/:id/queue", getDepartmentQueue);
departmentRouter.post("/:id/join-queue", authUser, joinDepartmentQueue);
departmentRouter.put("/visit/:visitId/status", updateVisitStatus);

// Visit memo routes
departmentRouter.get("/visit-memos/all",  getAllVisitMemos);
departmentRouter.post("/memo/create", authAdmin, createVisitMemo);
departmentRouter.get("/memo/:id", getVisitMemoById);
departmentRouter.put("/memo/:id/update", authUser, updateVisitMemo);
departmentRouter.get("/memo/user/:userId", authUser, getUserMemos);
departmentRouter.put("/memo/:id/read", authUser, markMemoAsRead);
departmentRouter.put("/visit-memos/:id", updateVisitMemo); // Add this new route

// Test management routes
departmentRouter.get("/tests/list", getAllTests);
departmentRouter.get("/tests/department/:departmentId", getTestsByDepartment);
departmentRouter.post("/tests/create", authAdmin, createTest);
departmentRouter.put("/tests/:id", authAdmin, updateTest);
departmentRouter.delete("/tests/:id", authAdmin, deleteTest);

export default departmentRouter;