import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import express, { Router } from "express";
import { GoogleGenAI } from "@google/genai";
const router: Router = express();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

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

    const SYSTEM_PROMPT = `
    You are an intelligent PDF assistant. Your task is to help the user understand the content of PDF documents.
    Use only the information provided in the retrieved context below to answer the user's question:

    ${JSON.stringify(result)}       

    If the answer cannot be found in the context, say:
    "I'm sorry, I couldn't find that information in the document."

    Be concise, clear, and accurate in your responses. Avoid guessing or including information that isn't supported by the context.
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: SYSTEM_PROMPT,
    });
    const source = result.map((doc) => ({
      pageNumber: doc.metadata.loc.pageNumber,
      snippet: doc.pageContent.slice(0, 300) + "...",
    }));

    res.json({
      response: response.text,
      result: source,
    });
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
