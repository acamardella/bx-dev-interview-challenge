import React, { useEffect, useState } from "react";
import type { FileItem } from "./utils/type";


type Props = {
  newFile?: FileItem | null;
};

const FilesList: React.FC<Props> = ({ newFile }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(process.env.PUBLIC_API_BASE + "/files/list");
        if (!res.ok) throw new Error("Errore nel caricamento dei file");
        const data: FileItem[] = await res.json();
        setFiles(data);
      } catch (err) {
        console.error("Errore fetch files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  useEffect(() => {
    if (newFile) {
      setFiles((prev) => [newFile, ...prev]);
    }
  }, [newFile]);

  if (loading) return <p className="p-4">Caricamento...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📂 File disponibili</h2>

      {files.length === 0 ? (
        <p>Nessun file trovato.</p>
      ) : (
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Nome file</th>
              <th className="p-2 border">Dimensione</th>
              <th className="p-2 border">Ultima modifica</th>
              <th className="p-2 border">Download</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.key} className="hover:bg-gray-50">
                <td className="p-2 border">{file.key}</td>
                <td className="p-2 border">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </td>
                <td className="p-2 border">
                  {new Date(file.lastModified).toLocaleString()}
                </td>
                <td className="p-2 border text-blue-600 underline">
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    Scarica
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FilesList;
