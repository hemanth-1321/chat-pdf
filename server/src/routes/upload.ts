import express, { Router } from "express";
import multer from "multer";
import { Queue } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
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

router.get("/chat", async (req, res) => {
  try {
    const userQuery = "How to compile a.texfile to a.pdffile";

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-embedding-exp-03-07",
    });

    const client = new QdrantClient({ url: process.env.QDRANT_URL });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client,
        collectionName: "pdf-docs",
      }
    );

    const retriever = vectorStore.asRetriever({ k: 2 });

    const result = await retriever.invoke(userQuery);

    res.json(result); // send result as response
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
