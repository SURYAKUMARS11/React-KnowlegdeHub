const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/", userController.list);
router.put("/:id/role", userController.updateRole);
router.put("/:id/deactivate", userController.deactivate);
router.put("/:id/activate", userController.activate);

module.exports = router;
