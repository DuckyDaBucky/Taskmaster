import React from "react";
import { FileText, Image, File, Download } from "lucide-react";

const RESOURCES_DATA = [
  { id: 1, name: "Algorithm Cheat Sheet.pdf", type: "PDF", size: "2.4 MB", date: "Oct 20, 2023" },
  { id: 2, name: "Database Schema Diagram.png", type: "Image", size: "1.1 MB", date: "Oct 18, 2023" },
  { id: 3, name: "Lecture Notes - Week 5.docx", type: "Doc", size: "500 KB", date: "Oct 15, 2023" },
  { id: 4, name: "Project Proposal.pdf", type: "PDF", size: "3.2 MB", date: "Oct 10, 2023" },
];

const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors">
          Upload File
        </button>
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Size</th>
              <th className="px-6 py-3">Date Added</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {RESOURCES_DATA.map((file) => (
              <tr key={file.id} className="hover:bg-secondary/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {file.type === "PDF" ? <FileText size={18} /> : file.type === "Image" ? <Image size={18} /> : <File size={18} />}
                  </span>
                  {file.name}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{file.type}</td>
                <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                <td className="px-6 py-4 text-muted-foreground">{file.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourcesPage;
