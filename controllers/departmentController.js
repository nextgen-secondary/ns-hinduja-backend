import departmentModel from "../models/departmentModel.js";
import departmentVisitModel from "../models/departmentVisitModel.js";
import visitMemoModel from "../models/visitMemoModel.js";
import userModel from "../models/userModel.js";
import testModel from "../models/testModel.js"; // Add this import

// Department management controllers
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await departmentModel.find({ isActive: true });
    res.json({ success: true, departments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await departmentModel.findById(req.params.id);
    if (!department) {
      return res.json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, department });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description, averageWaitTime, location, image } = req.body;
    
    if (!name) {
      return res.json({ success: false, message: "Department name is required" });
    }
    
    const newDepartment = new departmentModel({
      name,
      description,
      averageWaitTime,
      location,
      image,
      currentQueueSize: 0
    });
    
    await newDepartment.save();
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit department added event
    io.emit('department-added', {
      departmentId: newDepartment._id,
      department: newDepartment
    });
    
    res.json({ success: true, message: "Department created successfully", department: newDepartment });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { name, description, averageWaitTime, isActive, location, image } = req.body;
    
    const department = await departmentModel.findByIdAndUpdate(
      req.params.id,
      { name, description, averageWaitTime, isActive, location, image },
      { new: true }
    );
    
    if (!department) {
      return res.json({ success: false, message: "Department not found" });
    }
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit department updated event
    io.emit('department-updated', {
      departmentId: department._id,
      department
    });
    
    res.json({ success: true, message: "Department updated successfully", department });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await departmentModel.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.json({ success: false, message: "Department not found" });
    }
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit department deleted event
    io.emit('department-deleted', {
      departmentId: req.params.id
    });
    
    res.json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Queue management controllers
export const getDepartmentQueue = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Get department details
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      return res.json({ success: false, message: "Department not found" });
    }
    
    // Get active visits for this department
    const activeVisits = await departmentVisitModel.find({
      departmentId,
      status: { $in: ["waiting", "in-progress"] }
    }).sort({ tokenNumber: 1 });
    
    // Format queue data
    const queueData = {
      departmentId,
      departmentName: department.name,
      currentQueueSize: activeVisits.length,
      averageWaitTime: department.averageWaitTime,
      estimatedTotalWaitTime: department.averageWaitTime * activeVisits.length,
      queue: activeVisits.map((visit, index) => ({
        position: index + 1,
        tokenNumber: visit.tokenNumber,
        patientName: visit.patientName,
        status: visit.status,
        waitTime: department.averageWaitTime * index
      }))
    };
    
    res.json({ success: true, queueData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update the joinDepartmentQueue function
export const joinDepartmentQueue = async (req, res) => {
  try {
    const { userId, patientName, memoId } = req.body;
    const departmentId = req.params.id;
    
    // Get department details
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      return res.json({ success: false, message: "Department not found" });
    }
    
    // Get user details
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Generate token number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastVisit = await departmentVisitModel.findOne({
      departmentId,
      checkInTime: { $gte: today }
    }).sort({ tokenNumber: -1 });
    
    const tokenNumber = lastVisit ? lastVisit.tokenNumber + 1 : 1;
    
    // Create new visit
    const newVisit = new departmentVisitModel({
      patientId: user.patientId || userId,
      patientName: patientName || user.name,
      departmentId,
      departmentName: department.name,
      tokenNumber,
      estimatedWaitTime: department.averageWaitTime * department.currentQueueSize
    });
    
    await newVisit.save();
    
    // Update department queue size
    await departmentModel.findByIdAndUpdate(
      departmentId,
      { $inc: { currentQueueSize: 1 } }
    );
    
    // If memoId is provided, update the visit memo
    if (memoId) {
      await visitMemoModel.updateOne(
        { 
          _id: memoId,
          "departments.departmentId": departmentId 
        },
        { 
          $set: { 
            "departments.$.visitId": newVisit._id,
            "departments.$.tokenNumber": tokenNumber
          }
        }
      );
    }
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit queue update event
    io.emit('queue-updated', {
      departmentId,
      queueSize: department.currentQueueSize + 1,
      newVisit
    });
    
    res.json({ 
      success: true, 
      message: "Successfully joined the queue", 
      visit: newVisit 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const visitId = req.params.visitId;
    
    if (!["waiting", "in-progress", "completed", "cancelled"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }
    
    const visit = await departmentVisitModel.findById(visitId);
    if (!visit) {
      return res.json({ success: false, message: "Visit not found" });
    }
    
    // Update visit status
    const updatedVisit = await departmentVisitModel.findByIdAndUpdate(
      visitId,
      { 
        status,
        ...(status === "completed" ? { completionTime: new Date() } : {})
      },
      { new: true }
    );
    
    // Update department queue size if status is completed or cancelled
    if (status === "completed" || status === "cancelled") {
      await departmentModel.findByIdAndUpdate(
        visit.departmentId,
        { $inc: { currentQueueSize: -1 } }
      );
    }
    
    // Update visit memo if exists
    await visitMemoModel.updateMany(
      { "departments.visitId": visitId },
      { 
        $set: { 
          "departments.$.isVisited": status === "completed",
        }
      }
    );
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit visit status update event
    io.emit('visit-status-updated', {
      departmentId: visit.departmentId,
      visitId,
      status
    });
    
    res.json({ 
      success: true, 
      message: "Visit status updated successfully", 
      visit: updatedVisit 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Visit memo controllers
export const createVisitMemo = async (req, res) => {
  try {
    const { patientId, patientName, departments, message } = req.body;
    
    // Enhanced validation
    if (!patientId) {
      return res.json({ success: false, message: "Patient ID is required" });
    }
    
    // Find user by patientId
    const user = await userModel.findOne({ patientId: patientId });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    let newMemo = new visitMemoModel({
      patientId: user.patientId,  // Use the patientId string
      patientName: patientName || user.name,
      departments: departments.map(dept => ({
        ...dept,
        isVisited: false,
        tests: dept.tests.map(test => ({
          ...test,
          isSelected: true,
          isCompleted: false
        }))
      })),
      message
    });
    
    await newMemo.save();
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit memo created event
    io.emit('memo-created', {
      userId: user._id,
      memo: newMemo
    });
    
    res.json({ success: true, message: "Visit memo created successfully", memo: newMemo });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export const getUserMemos = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const memos = await visitMemoModel.find({ patientId: userId }).populate('patientId', "name email").sort({ createdAt: -1 });
    
    res.json({ success: true, memos });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const markMemoAsRead = async (req, res) => {
  try {
    const memo = await visitMemoModel.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!memo) {
      return res.json({ success: false, message: "Memo not found" });
    }
    
    res.json({ success: true, message: "Memo marked as read", memo });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Test management controllers
export const getAllTests = async (req, res) => {
  try {
    const tests = await testModel.find({ isActive: true });
    res.json({ success: true, tests });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getTestsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const tests = await testModel.find({ departmentId, isActive: true });
    res.json({ success: true, tests });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const createTest = async (req, res) => {
  try {
    const { name, description, departmentId, departmentName, averageProcessTime, price } = req.body;
    
    if (!name || !departmentId) {
      return res.json({ success: false, message: "Test name and department are required" });
    }
    
    const newTest = new testModel({
      name,
      description,
      departmentId,
      departmentName,
      averageProcessTime,
      price
    });
    
    await newTest.save();
    
    res.json({ success: true, message: "Test created successfully", test: newTest });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const updateTest = async (req, res) => {
  try {
    const { name, description, departmentId, departmentName, averageProcessTime, price, isActive } = req.body;
    
    const test = await testModel.findByIdAndUpdate(
      req.params.id,
      { name, description, departmentId, departmentName, averageProcessTime, price, isActive },
      { new: true }
    );
    
    if (!test) {
      return res.json({ success: false, message: "Test not found" });
    }
    
    res.json({ success: true, message: "Test updated successfully", test });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const test = await testModel.findByIdAndDelete(req.params.id);
    
    if (!test) {
      return res.json({ success: false, message: "Test not found" });
    }
    
    res.json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// Add this function after the getVisitMemoById function
export const updateVisitMemo = async (req, res) => {
  try {
    const { departments, status } = req.body;
    
    const memo = await visitMemoModel.findById(req.params.id);
    if (!memo) {
      return res.json({ success: false, message: "Visit memo not found" });
    }
    
    // Update memo
    const updatedMemo = await visitMemoModel.findByIdAndUpdate(
      req.params.id,
      { 
        ...(departments ? { departments } : {}),
        ...(status ? { status } : {})
      },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: "Visit memo updated successfully", 
      memo: updatedMemo 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// Add this function after the createVisitMemo function
export const getVisitMemoById = async (req, res) => {
  try {
    const memo = await visitMemoModel.findById(req.params.id);
    
    if (!memo) {
      return res.json({ success: false, message: "Visit memo not found" });
    }
    
    // Get current queue information for each department
    const departmentsWithQueueInfo = await Promise.all(
      memo.departments.map(async (dept) => {
        const queueInfo = await getDepartmentQueueInfo(dept.departmentId);
        return {
          ...dept.toObject(),
          queueInfo
        };
      })
    );
    
    res.json({ 
      success: true, 
      memo: {
        ...memo.toObject(),
        departments: departmentsWithQueueInfo
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Helper function to get department queue info (if not already defined)
const getDepartmentQueueInfo = async (departmentId) => {
  try {
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      return null;
    }
    
    const activeVisits = await departmentVisitModel.find({
      departmentId,
      status: { $in: ["waiting", "in-progress"] }
    }).sort({ tokenNumber: 1 });
    
    return {
      currentQueueSize: activeVisits.length,
      averageWaitTime: department.averageWaitTime,
      estimatedTotalWaitTime: department.averageWaitTime * activeVisits.length
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};