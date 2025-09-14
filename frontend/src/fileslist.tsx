import React, { useEffect, useState } from "react";
import type { FileItem } from "./utils/type";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

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
        throw err;
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

      <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell align="right">Dimensione</TableCell>
                  <TableCell align="right">Modificato</TableCell>
                  <TableCell align="right">Scarica</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow
                    key={file.key}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {file.key}
                    </TableCell>
                    <TableCell align="right">{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                    <TableCell align="right">{new Date(file.lastModified).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        Scarica
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      )}
    </div>
  );
};

export default FilesList;
