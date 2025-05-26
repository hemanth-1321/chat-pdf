import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { QdrantClient } from "@qdrant/js-client-rest";

const worker = new Worker(
  "file-upload",
  async (job) => {
    try {
      console.log(`\n Job:`, job.data);

      const { filename, path } = job.data;

      const loader = new PDFLoader(path);
      const docs = await loader.load();

      if (!docs.length) {
        console.warn(` No documents loaded from ${filename}`);
        return;
      }

      const validDocs = docs.filter(
        (doc) => doc.pageContent?.trim().length > 0
      );
      if (!validDocs.length) {
        console.warn(` All pages were empty in: ${filename}`);
        return;
      }

      // Split documents into token-aware chunks
      const splitter = new TokenTextSplitter({
        encodingName: "cl100k_base",
        chunkSize: 300,
        chunkOverlap: 50,
      });

      const splitDocs = await splitter.splitDocuments(validDocs);
      console.log(` Total split docs to embed: ${splitDocs.length}`);

      // Log chunk previews
      splitDocs.forEach((doc, i) => {
        console.log(` Chunk ${i} preview:`, doc.pageContent.slice(0, 80));
      });

      // Setup embedding and vector store
      const client = new QdrantClient({ url: process.env.QDRANT_URL });
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: "gemini-embedding-exp-03-07",
      });

      const texts = splitDocs.map((doc) => doc.pageContent);

      // Embed each document chunk sequentially for better error handling
      const filteredDocs = [];
      const filteredVectors = [];

      for (let i = 0; i < texts.length; i++) {
        try {
          const vector = await embeddings.embedQuery(texts[i]);

          if (Array.isArray(vector) && vector.length === 3072) {
            filteredDocs.push(splitDocs[i]);
            filteredVectors.push(vector);
            console.log(`Embedded chunk ${i} (3072 dims)`);
          } else {
            console.warn(`Invalid vector length for chunk ${i}`);
          }
        } catch (err) {
          console.error(`Embedding failed for chunk ${i}`, err);
        }
      }

      if (filteredDocs.length === 0) {
        console.warn(
          `All embeddings failed or were invalid. Skipping Qdrant upload.`
        );
        return;
      }

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          client,
          collectionName: "pdf-docs",
        }
      );

      await vectorStore.addVectors(filteredVectors, filteredDocs);

      console.log(
        `Successfully added ${filteredDocs.length} docs to Qdrant vector store`
      );
    } catch (err) {
      console.error(`Job ${job?.id} failed with error:`, err);
      throw err;
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

// Handle job events
worker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
