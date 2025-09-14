import { useState, ChangeEvent, useEffect } from "react";
import FilesList from "./fileslist";
import type { FileItem } from "./utils/type";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [newFile, setNewFile] = useState<FileItem | null>(null);

  const API_BASE = process.env.PUBLIC_API_BASE + "/files"; // NestJS API
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      
    }
  }, []);

  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProgress(0);
      setMessage("");
    }
  };

  const uploadFile = async () => {
    try {
        if (!file) {
          setMessage("❌ Seleziona un file video");
          return;
        }
        if(file.size > MAX_FILE_SIZE) {
          setMessage("❌ Errore "+ file.name + " supera 500MB");
          return;

        }

        console.log('inizia upload');
        const initRes = await fetch(`${API_BASE}/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });

        const { uploadId, key } = await initRes.json();

        //chunk da 5MB
        const chunkSize = 5 * 1024 * 1024;
        const chunks = Math.ceil(file.size / chunkSize);

        for (let partNumber = 1; partNumber <= chunks; partNumber++) {
          
          const start = (partNumber - 1) * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const blob = file.slice(start, end);

          const res = await fetch(
                `${API_BASE}/url?key=${key}&uploadId=${uploadId}&partNumber=${partNumber}`
              );
          const presignedUrl = await res.text();
          

          await fetch(presignedUrl, {
            method: "PUT",
            body: blob,
          });

          setProgress(Math.round((partNumber / chunks) * 100));

        }

        const completeRes = await fetch(`${API_BASE}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, uploadId }),
        });
        
        if (!completeRes.ok) throw new Error("Errore completamento upload");
        setMessage("✅ Upload completato con successo!");
        

        
        const metaRes = await fetch(`${API_BASE}/meta?key=${file.name}`);
        if (!metaRes.ok) throw new Error("Errore fetch metadata file");
        const newFileMeta: FileItem = await metaRes.json();

        setNewFile(newFileMeta);

    } catch (err) {
       setMessage("❌ Errore upload: " + err);
    }
    finally {
      setFile(null);
      setProgress(0);
    }

  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Video su S3</h2>

      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={uploadFile} disabled={!file}>
        Carica
      </button>

      {progress > 0 && <p>Progresso: {progress}%</p>}
      {message && <p className="mt-2">{message}</p>}

      {/* Lista dei file disponibili */}
      <FilesList newFile={newFile} />

    </div>
  );
}
