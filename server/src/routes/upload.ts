import express, { Router } from "express";
import multer from "multer";
import { Queue } from "bullmq";

const queue = new Queue("file-upload", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});
const upload = multer({
  dest: "uploads/",
});

const router: Router = express();

router.post("/pdf", upload.single("pdf"), async (req, res) => {
  console.log("Uploaded file details:", req.file);
  await queue.add("file-ready", {
    filename: req.file?.originalname,
    destination: req.file?.destination,
    path: req.file?.path,
  });

  try {
    res.status(201).json({
      message: "uploaded",
    });
  } catch (error) {
    console.log(error);
  }
});

export default router;
