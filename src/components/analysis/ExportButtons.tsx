import { Button } from "@/components/ui/button";
import { FileText, FileType2, Loader2 } from "lucide-react";

interface ExportButtonsProps {
  onExportDoc: () => void;
  onExportPdf: () => void;
  isCreatingDoc: boolean;
  isCreatingPdf: boolean;
  isGeneratingInsights: boolean;
}

export function ExportButtons({
  onExportDoc,
  onExportPdf,
  isCreatingDoc,
  isCreatingPdf,
  isGeneratingInsights,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onExportDoc}
        disabled={isCreatingDoc || isGeneratingInsights}
        variant="outline"
      >
        {isCreatingDoc ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export to Google Doc
      </Button>
      <Button
        onClick={onExportPdf}
        disabled={isCreatingPdf || isGeneratingInsights}
        variant="outline"
      >
        {isCreatingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileType2 className="mr-2 h-4 w-4" />
        )}
        Export to PDF
      </Button>
    </div>
  );
}