// components/CartStep2And3.tsx
import { useState } from "react";
import { Calendar, FileText, X, Loader2, Sparkles } from "lucide-react";

interface ReportData {
  spt_number: string;
  destination: string;
  place_of_execution: string;
  start_date: string;
  end_date: string;
}

interface CartStep2And3Props {
  docsFile: File | null;
  reportData: ReportData;
  onFileChange: (file: File | null) => void;
  onReportChange: (data: ReportData) => void;
  onUsersExtracted?: (users: string[]) => void;
}

export default function CartStep2({
  docsFile,
  reportData,
  onFileChange,
  onReportChange,
  onUsersExtracted,
}: CartStep2And3Props) {
  const [localDocsFile, setLocalDocsFile] = useState<File | null>(docsFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (file.type !== "application/pdf") {
        alert("Hanya file PDF yang diperbolehkan");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File terlalu besar. Maksimal 5MB");
        e.target.value = "";
        return;
      }

      setLocalDocsFile(file);
      onFileChange(file);

      // Auto-process PDF untuk extract data
      await processPDF(file);
    }
  };

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setProcessingError(null);
    setIsAutoFilled(false);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      // Call Python service directly
      const response = await fetch("http://localhost:5000/process-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memproses PDF");
      }

      const result = await response.json();

      // Auto-fill report data dari response
      if (result.report) {
        onReportChange({
          spt_number: result.report.spt_number || "",
          destination: result.report.destination || "",
          place_of_execution: result.report.place_of_execution || "",
          start_date: result.report.start_date || "",
          end_date: result.report.end_date || "",
        });
        setIsAutoFilled(true);
      }

      // Pass extracted users to parent if callback provided
      if (result.user && onUsersExtracted) {
        onUsersExtracted(result.user);
      }
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      setProcessingError(error.message || "Gagal memproses PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setLocalDocsFile(null);
    onFileChange(null);
    setIsAutoFilled(false);
    setProcessingError(null);
  };

  const handleReportFieldChange = (field: keyof ReportData, value: string) => {
    onReportChange({
      ...reportData,
      [field]: value,
    });
  };

  const isReportValid =
    reportData.spt_number.trim() !== "" &&
    reportData.destination.trim() !== "" &&
    reportData.place_of_execution.trim() !== "" &&
    reportData.start_date !== "" &&
    reportData.end_date !== "" &&
    new Date(reportData.start_date) < new Date(reportData.end_date);

  return (
    <div className="space-y-6 pb-4">
      {/* Bagian Upload Dokumen */}
      <div className="space-y-4">
        <div className="alert alert-info">
          <FileText className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Upload Dokumen SPT</h3>
            <p className="text-sm">
              Upload PDF SPT untuk auto-fill data kegiatan
            </p>
          </div>
        </div>

        <input
          type="file"
          accept=".pdf,application/pdf"
          className="file-input file-input-bordered w-full bg-white border-gray-300"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  🔄 Memproses dokumen SPT...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Mengekstrak data dari PDF menggunakan AI
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-filled Success */}
        {isAutoFilled && !isProcessing && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">
                  ✨ Data berhasil diekstrak dan diisi otomatis!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Silakan periksa dan edit jika diperlukan
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {processingError && (
          <div className="alert alert-error">
            <span>❌ {processingError}</span>
          </div>
        )}

        {localDocsFile && !isProcessing && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  📄 File: {localDocsFile.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Ukuran: {(localDocsFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                className="btn btn-xs btn-error"
                onClick={handleRemoveFile}
              >
                <X className="w-3 h-3" />
                Hapus
              </button>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-1">Catatan:</p>
          <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
            <li>Hanya file PDF yang diperbolehkan</li>
            <li>Ukuran maksimal 5MB</li>
          </ul>
        </div>
      </div>

      {/* Garis Pemisah */}
      <div className="border-t pt-6">
        <div className="alert alert-warning">
          <Calendar className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Data SPT & Kegiatan</h3>
            <p className="text-sm">
              Isi informasi SPT dan detail kegiatan (Wajib)
            </p>
          </div>
        </div>
      </div>

      {/* Bagian Form Data SPT */}
      <div className="space-y-4">
        {/* Nomor SPT */}
        <div className="form-control flex justify-between">
          <label className="label">
            <span className="label-text font-medium">Nomor SPT *</span>
          </label>
          <input
            type="text"
            className="input input-bordered bg-white border-black"
            placeholder="Contoh: 001/SPT/IT/2024"
            value={reportData.spt_number}
            onChange={(e) =>
              handleReportFieldChange("spt_number", e.target.value)
            }
            required
          />
        </div>

        {/* Tujuan Kegiatan */}
        <div className="form-control flex justify-between">
          <label className="label">
            <span className="label-text font-medium">Tujuan Kegiatan *</span>
          </label>
          <input
            type="text"
            className="input input-bordered bg-white border-black"
            placeholder="Contoh: Maintenance Server"
            value={reportData.destination}
            onChange={(e) =>
              handleReportFieldChange("destination", e.target.value)
            }
            required
          />
        </div>

        {/* Tempat Pelaksanaan */}
        <div className="form-control flex justify-between">
          <label className="label">
            <span className="label-text font-medium">Tempat Pelaksanaan *</span>
          </label>
          <input
            type="text"
            className="input input-bordered bg-white border-black"
            placeholder="Contoh: Kantor Pusat"
            value={reportData.place_of_execution}
            onChange={(e) =>
              handleReportFieldChange("place_of_execution", e.target.value)
            }
            required
          />
        </div>

        {/* Tanggal Mulai & Selesai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control scheme-light">
            <label className="input bg-white text-black input-warning">
              <span className="label">
                <Calendar className="w-4 h-4" />
                Tanggal Mulai *
              </span>
              <input
                type="date"
                value={reportData.start_date}
                onChange={(e) =>
                  handleReportFieldChange("start_date", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
          </div>

          <div className="form-control scheme-light">
            <label className="input bg-white text-black input-warning">
              <span className="label ">
                <Calendar className="w-4 h-4" />
                Tanggal Selesai
              </span>
              <input
                type="date"
                value={reportData.end_date}
                onChange={(e) =>
                  handleReportFieldChange("end_date", e.target.value)
                }
                min={
                  reportData.start_date ||
                  new Date().toISOString().split("T")[0]
                }
                required
              />
            </label>
          </div>
        </div>

        {/* Preview Data */}
        {isReportValid && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              ✅ Data SPT Valid
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>📄 No. SPT: {reportData.spt_number}</p>
              <p>🎯 Tujuan: {reportData.destination}</p>
              <p>📍 Tempat: {reportData.place_of_execution}</p>
              <p>
                📅 Periode:{" "}
                {new Date(reportData.start_date).toLocaleDateString("id-ID")} -{" "}
                {new Date(reportData.end_date).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {reportData.start_date &&
          reportData.end_date &&
          new Date(reportData.start_date) >= new Date(reportData.end_date) && (
            <div className="alert alert-error">
              <span>⚠️ Tanggal selesai harus setelah tanggal mulai</span>
            </div>
          )}
      </div>
    </div>
  );
}
