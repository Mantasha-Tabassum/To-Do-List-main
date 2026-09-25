const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// GET ALL TASKS
// Only logged-in user's tasks
// ============================================

router.get("/", authMiddleware, async (req, res) => {
    try {

        const tasks = await Task.find({
            userId: req.user.userId
        }).sort({
            createdAt: -1
        });

        res.status(200).json(tasks);

    } catch (error) {

        console.error("Get tasks error:", error);

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});


// ============================================
// GET SINGLE TASK
// ============================================

router.get("/:id", authMiddleware, async (req, res) => {
    try {

        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json(task);

    } catch (error) {

        console.error("Get task error:", error);

        res.status(500).json({
            message: "Failed to fetch task"
        });
    }
});


// ============================================
// CREATE TASK
// Automatically attach logged-in user's ID
// ============================================

router.post("/", authMiddleware, async (req, res) => {
    try {

        const {
            text,
            priority,
            category,
            dueDate
        } = req.body;


        if (!text || text.trim() === "") {

            return res.status(400).json({
                message: "Task text is required"
            });
        }


        const newTask = new Task({

            userId: req.user.userId,

            text: text.trim(),

            priority: priority || "Medium",

            category: category || "General",

            dueDate: dueDate || null
        });


        const savedTask = await newTask.save();

        res.status(201).json(savedTask);

    } catch (error) {

        console.error("Create task error:", error);

        res.status(500).json({
            message: "Failed to create task"
        });
    }
});


// ============================================
// UPDATE TASK
// User can update only their own task
// ============================================

router.put("/:id", authMiddleware, async (req, res) => {
    try {

        const {
            text,
            completed,
            priority,
            category,
            dueDate
        } = req.body;


        const updateData = {};


        if (text !== undefined) {

            if (!text.trim()) {

                return res.status(400).json({
                    message: "Task text cannot be empty"
                });
            }

            updateData.text = text.trim();
        }


        if (completed !== undefined) {
            updateData.completed = completed;
        }


        if (priority !== undefined) {
            updateData.priority = priority;
        }


        if (category !== undefined) {
            updateData.category = category;
        }


        if (dueDate !== undefined) {
            updateData.dueDate = dueDate || null;
        }


        const updatedTask =
            await Task.findOneAndUpdate(

                {
                    _id: req.params.id,
                    userId: req.user.userId
                },

                updateData,

                {
                    new: true,
                    runValidators: true
                }
            );


        if (!updatedTask) {

            return res.status(404).json({
                message: "Task not found"
            });
        }


        res.status(200).json(updatedTask);

    } catch (error) {

        console.error("Update task error:", error);

        res.status(500).json({
            message: "Failed to update task"
        });
    }
});


// ============================================
// DELETE TASK
// User can delete only their own task
// ============================================

router.delete("/:id", authMiddleware, async (req, res) => {
    try {

        const deletedTask =
            await Task.findOneAndDelete({

                _id: req.params.id,

                userId: req.user.userId
            });


        if (!deletedTask) {

            return res.status(404).json({
                message: "Task not found"
            });
        }


        res.status(200).json({

            message: "Task deleted successfully",

            task: deletedTask
        });

    } catch (error) {

        console.error("Delete task error:", error);

        res.status(500).json({
            message: "Failed to delete task"
        });
    }
});


module.exports = router;