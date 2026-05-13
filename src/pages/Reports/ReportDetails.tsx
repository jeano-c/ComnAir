import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {
  useReport,
  useUpdateReport,
  useReportHistory,
} from "../../hooks/useReport";
import { useParams } from "react-router";
import { VscLoading } from "react-icons/vsc";
import { MdArrowDropDown } from "react-icons/md";
import { useReply } from "../../hooks/useReply";

const STATUS_OPTIONS = ["New", "Under Review", "Resolved"];
const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  New: { dot: "bg-blue-400", text: "text-blue-600" },
  "Under Review": { dot: "bg-amber-400", text: "text-amber-600" },
  Resolved: { dot: "bg-green-400", text: "text-[#1F8F22]" },
};

const censorEmail = (email: string) => {
  if (!email || !email.includes("@")) return email || "Anonymous";
  const [name, domain] = email.split("@");
  const maskedName =
    name.length > 2 ? name.substring(0, 2) + "***" : name + "***";
  return `${maskedName}@${domain}`;
};

function ReportDetails() {
  const updateReportMutation = useUpdateReport();
  const { id } = useParams();
  const numericId = id ? Number(id) : undefined;
  const { reportData: report, isLoading, isError } = useReport(numericId!);
  const { history, isLoading: isHistoryLoading } = useReportHistory(numericId!);
  const createReplyMutation = useReply(numericId);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);

  const [currentStatus, setCurrentStatus] = useState<string>("New");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (report?.title) document.title = `Report: ${report.title}`;
    if (report) {
      setCurrentStatus(report.status || (report.resolve ? "Resolved" : "New"));
    }
    return () => {
      document.title = "Active Reports";
    };
  }, [report?.title, report?.status, report?.resolve]);

  const isResolved = report?.resolve;

  useEffect(() => {
    if (!wrapperRef.current || isLoading || isResolved) return;
    if (quillInstance.current) return;

    wrapperRef.current.innerHTML = "";
    const editorDiv = document.createElement("div");
    editorDiv.className = "min-h-40";
    wrapperRef.current.appendChild(editorDiv);
    const quill = new Quill(editorDiv, {
      theme: "snow",
      placeholder: "Explain the resolution...",
    });
    quillInstance.current = quill;

    return () => {
      if (wrapperRef.current) wrapperRef.current.innerHTML = "";
      quillInstance.current = null;
    };
  }, [isLoading, isResolved]);

  const handleSendReply = () => {
    if (!quillInstance.current || !report) return;
    const htmlContent = quillInstance.current.root.innerHTML;
    const plainText = quillInstance.current.getText().trim();
    if (plainText.length === 0) return;
    createReplyMutation.mutate({ reportId: numericId!, content: htmlContent });
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setIsStatusMenuOpen(false);
    if (numericId) {
      updateReportMutation.mutate({
        id: numericId,
        status: newStatus,
        resolve: newStatus === "Resolved",
      });
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VscLoading className="animate-spin text-4xl text-[#1F8F22]" />
      </div>
    );

  if (isError || !report)
    return (
      <div className="p-12 text-red-500 font-medium">Error loading report.</div>
    );

  const activeStyle = STATUS_STYLES[currentStatus] || STATUS_STYLES["New"];

  return (
    <>
      <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col min-h-screen relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
            {report.title || "User Report"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8">
            {/* 1. Original Report Content */}
            <div className="bg-white border-2 border-[#1F8F22]/40 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[linear-gradient(270deg,rgba(146,146,146,0.7)_0%,rgba(31,143,34,0.7)_64%,rgba(9,70,10,0.7)_100%)] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#1F8F22]/40">
                  {report.email ? report.email[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] tracking-wide">
                    {censorEmail(report.email)}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <hr className="w-full h-px bg-gray-200 border-none mb-6" />

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {report.content}
              </div>

              {/* Image Evidence */}
              {report.medias && report.medias.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Attached Evidence
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {report.medias.map((media: any) => (
                      <div
                        key={media.id}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm hover:border-[#1F8F22] hover:shadow-md transition-all duration-200"
                        onClick={() => setSelectedImage(media.url)}
                      >
                        <img
                          src={media.url}
                          alt="Report Attachment"
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm drop-shadow-md">
                            View
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Resolution / Reply */}
            {report.resolve && report.reply ? (
              <div className="bg-white border-2 border-[#1F8F22]/40 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1F8F22]" />
                <h2 className="text-[#1F8F22] font-bold mb-4 text-lg tracking-wide">
                  Resolution Provided
                </h2>
                <div className="ql-snow">
                  <div
                    className="ql-editor p-0! text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: report.reply.content }}
                  />
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 text-xs sm:text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-2 font-medium">
                  <span>
                    Resolved by:{" "}
                    <span className="text-gray-800">
                      {report.reply.user?.email}
                    </span>
                  </span>
                  <span>
                    {new Date(report.reply.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-[#1F8F22]/40 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300">
                <h2 className="text-lg sm:text-xl font-bold mb-6 text-[#1a1a1a]">
                  Reply to User
                </h2>
                <div className="rounded-lg border overflow-hidden">
                  <div ref={wrapperRef} />
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={createReplyMutation.isPending}
                    className="bg-[#1F8F22] cursor-pointer hover:bg-[#1a7a1d] text-white px-6 py-2.5 rounded-md font-medium text-sm transition shadow-sm active:scale-95 duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                  >
                    {createReplyMutation.isPending ? (
                      <VscLoading className="animate-spin text-xl" />
                    ) : (
                      "Submit Resolution"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="lg:col-span-1">
            {/* Single sticky wrapper — both cards travel together */}
            <div className="sticky top-8 flex flex-col gap-6 max-h-[calc(100vh-4rem)]">
              {/* Review Info */}
              <div className="bg-white border-2 border-[#1F8F22]/40 shadow-xl rounded-2xl p-6 transition-colors duration-300 shrink-0">
                <h3 className="font-bold text-[#1a1a1a] mb-4 border-b border-gray-200 pb-3 text-lg tracking-wide">
                  Review Info
                </h3>
                <div className="space-y-6 pt-2">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Status
                    </label>
                    <button
                      onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                      className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 hover:border-[#1F8F22]/50 hover:bg-white rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${activeStyle.dot} animate-pulse`}
                        />
                        <span
                          className={`text-sm font-bold uppercase tracking-wider ${activeStyle.text}`}
                        >
                          {currentStatus}
                        </span>
                      </div>
                      <MdArrowDropDown
                        className={`text-gray-500 text-xl transition-transform duration-200 ${isStatusMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isStatusMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsStatusMenuOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1F8F22]/20 shadow-xl rounded-lg overflow-hidden z-20">
                          {STATUS_OPTIONS.map((status) => {
                            const style = STATUS_STYLES[status];
                            const isSelected = status === currentStatus;
                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${isSelected ? "bg-[#1F8F22]/5" : ""}`}
                              >
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
                                />
                                <span
                                  className={`text-sm font-bold uppercase tracking-wider ${style.text}`}
                                >
                                  {status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Report ID
                    </label>
                    <span className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      #{report.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity History — scrolls inside, never bleeds out */}
              <div className="bg-white border-2 border-[#1F8F22]/40 shadow-xl rounded-2xl p-6 transition-colors duration-300 flex flex-col min-h-0">
                <h3 className="font-bold text-[#1a1a1a] mb-4 border-b border-gray-200 pb-3 text-lg tracking-wide shrink-0">
                  Activity History
                </h3>

                {isHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <VscLoading className="animate-spin text-2xl text-[#1F8F22]" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 font-medium">
                      No activity recorded yet.
                    </p>
                  </div>
                ) : (
                  // overflow-y-auto — history scrolls inside its card
                  <div className="overflow-y-auto flex-1 pr-1">
                    <div className="relative">
                      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />
                      <div className="flex flex-col gap-4">
                        {history.map((entry: any) => {
                          const dotColor =
                            entry.newStatus === "Resolved"
                              ? "bg-green-400 ring-green-100"
                              : entry.newStatus === "Under Review"
                                ? "bg-amber-400 ring-amber-100"
                                : "bg-blue-400 ring-blue-100";

                          return (
                            <div
                              key={entry.id}
                              className="flex items-start gap-3 relative"
                            >
                              <div
                                className={`mt-1.5 w-[10px] h-[10px] shrink-0 rounded-full ring-4 z-10 ${dotColor}`}
                              />
                              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs">
                                <div className="flex flex-col gap-0.5 mb-2">
                                  <span className="font-semibold text-[#1a1a1a] truncate">
                                    {entry.actorEmail ||
                                      entry.actorName ||
                                      "System"}
                                  </span>
                                  <span className="text-gray-400 font-medium">
                                    {new Date(entry.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {entry.previousStatus !== entry.newStatus && (
                                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1 w-fit">
                                      <span className="text-gray-400 font-medium uppercase tracking-wide">
                                        {entry.previousStatus}
                                      </span>
                                      <span className="text-gray-300">→</span>
                                      <span
                                        className={`font-bold uppercase tracking-wide ${STATUS_STYLES[entry.newStatus]?.text ?? "text-gray-600"}`}
                                      >
                                        {entry.newStatus}
                                      </span>
                                    </div>
                                  )}
                                  {entry.previousResolve !==
                                    entry.newResolve && (
                                    <div className="flex items-center bg-white border border-gray-200 rounded-full px-2.5 py-1 w-fit">
                                      <span
                                        className={`font-medium ${entry.newResolve ? "text-[#1F8F22]" : "text-amber-600"}`}
                                      >
                                        {entry.newResolve
                                          ? "Marked as resolved"
                                          : "Reopened"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-light cursor-pointer p-2 drop-shadow-md"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            <img
              src={selectedImage}
              alt="Enlarged Report Evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ReportDetails;
