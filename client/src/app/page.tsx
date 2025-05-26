import { UploadFile } from "@/components/Upload";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="w-full mt-20 md:w-[40%] p-6 border-b md:border-b-0 md:border-r shadow-sm flex justify-center items-center ">
        <UploadFile />
      </div>

      <div className="w-full md:w-[60%] p-6">
        <h2 className="text-2xl font-semibold mb-4">Chat</h2>
        <div className="min-h-[300px] border rounded-md p-4 text-gray-700 shadow-inner ">
          hello
        </div>
      </div>
    </div>
  );
}
