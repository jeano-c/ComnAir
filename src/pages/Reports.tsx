import { useState, useEffect, useRef } from "react";
import { CiCalendar } from "react-icons/ci";
import { Link } from "react-router";
// Make sure this path matches where your hooks are located
import { useReports, useDuplicates } from "../hooks/useReports";
import { VscLoading } from "react-icons/vsc";
import { MdOutlineDifference } from "react-icons/md";

const censorEmail = (email: string) => {
  if (!email || !email.includes("@")) return email || "Anonymous";
  const [name, domain] = email.split("@");
  const maskedName =
    name.length > 2 ? name.substring(0, 2) + "***" : name + "***";
  return `${maskedName}@${domain}`;
};

function Reports() {
  const labels = ["All Reports", "New", "Under Review", "Resolve"];
  const [activeLabel, setActiveLabel] = useState("All Reports");

  // Toggle between standard view and duplicates view
  const [isDuplicateView, setIsDuplicateView] = useState(false);

  const pageSize = 20;

  // Standard Reports Hook (Infinite Scroll)
  const {
    reportsData,
    isLoading: isReportsLoading,
    isError: isReportsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReports(pageSize);

  // Optimized Duplicates Hook (Only fetches when isDuplicateView is true)
  const {
    data: duplicateData,
    isLoading: isDuplicatesLoading,
    isError: isDuplicatesError,
  } = useDuplicates(isDuplicateView);

  const observerTarget = useRef(null);

  // Infinite Scroll Observer (Only active on Standard View)
  useEffect(() => {
    if (isDuplicateView) return; // Disable infinite scroll on duplicates view

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, isDuplicateView]);

  if (isReportsLoading || (isDuplicateView && isDuplicatesLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <VscLoading className="animate-spin text-4xl text-[#1F8F22]" />
        <p className="text-gray-500 font-medium tracking-wide text-sm">
          {isDuplicateView
            ? "Scanning AI vectors for duplicates..."
            : "Loading reports..."}
        </p>
      </div>
    );
  }

  if (isReportsError || (isDuplicateView && isDuplicatesError)) {
    return (
      <div className="p-12 text-center text-red-500 font-medium">
        Error loading data!
      </div>
    );
  }

  // Filter Standard Reports
  const filteredReports = reportsData.filter((report: any) => {
    if (activeLabel === "All Reports") return true;
    if (activeLabel === "Resolve") return report.resolve === true;
    return (
      report.status?.toLowerCase() === activeLabel.toLowerCase() &&
      !report.resolve
    );
  });

  // Filter Clusters (Only show clusters with actual duplicates, size > 1)
  const actualDuplicates =
    duplicateData?.clusters?.filter((c: any) => c.size > 1) || [];

  return (
    <div className="p-4 sm:p-6 md:p-12 h-full flex flex-col min-h-screen bg-[#fafafa]">
      {/* --- Header & Filters --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 py-3.5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
          Active Reports
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Action Button: Find Duplicates */}
          {/* <button
            onClick={() => setIsDuplicateView(!isDuplicateView)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 w-full sm:w-auto justify-center border-2
              ${
                isDuplicateView
                  ? "bg-[#1F8F22] text-white border-[#1F8F22] shadow-lg shadow-[#1F8F22]/30"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#1F8F22]/50 hover:text-[#1F8F22]"
              }`}
          >
            <MdOutlineDifference className="text-lg" />
            {isDuplicateView ? "Exit Duplicate View" : "Find Duplicates"}
          </button> */}

          <div className="w-px h-8 bg-gray-300 hidden sm:block"></div>

          {/* Standard Filters (Disabled in Duplicate View to avoid confusion) */}
          <div
            className={`flex flex-row flex-wrap gap-2 sm:gap-3 transition-opacity w-full sm:w-auto ${isDuplicateView ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          >
            {labels.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveLabel(item)}
                className={`px-5 py-2.5 rounded-full cursor-pointer text-sm font-semibold transition-all duration-200 active:scale-95 grow sm:grow-0
                  ${
                    activeLabel === item
                      ? "bg-[#1F8F22] text-white shadow-md shadow-[#1F8F22]/30"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- View Rendering --- */}
      {isDuplicateView ? (
        /* === DUPLICATES VIEW === */
        <div className="flex flex-col gap-6 pb-10">
          <div className="bg-[#1F8F22]/10 border border-[#1F8F22]/30 rounded-xl p-4 text-[#1F8F22] font-medium text-sm mb-4 flex items-center gap-3">
            <MdOutlineDifference className="text-xl" />
            Showing semantic duplicates using Vector AI search. Clusters with
            identical or highly similar phrasing are grouped below.
          </div>

          {actualDuplicates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
              <MdOutlineDifference className="text-6xl text-gray-300 mb-4" />
              <p className="text-center text-gray-500 font-medium">
                No duplicates found in the current dataset.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {actualDuplicates.map((cluster: any) => (
                <div
                  key={cluster.clusterId}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-[#1F8F22]/40 transition-colors duration-300 p-6 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      {cluster.size} Similar Reports
                    </span>
                  </div>

                  {/* Primary Report */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1F8F22]"></div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Primary Record
                      </span>
                      <Link
                        to={`/reports/${cluster.primaryReport.id}`}
                        className="text-xs text-[#1F8F22] hover:underline font-bold"
                      >
                        View #{cluster.primaryReport.id}
                      </Link>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">
                      {cluster.primaryReport.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {cluster.primaryReport.content}
                    </p>
                  </div>

                  {/* Sub Reports */}
                  <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-100 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Potential Duplicates
                    </span>
                    {cluster.similarReports.map((sim: any) => (
                      <div
                        key={sim.report.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 gap-3 group"
                      >
                        <div className="min-w-0">
                          <h5 className="font-semibold text-sm text-gray-800 truncate">
                            {sim.report.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500 font-mono">
                              Match Score:{" "}
                              {(sim.similarityToPrimary * 100).toFixed(1)}%
                            </p>
                            <span
                              className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${sim.report.resolve ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {sim.report.resolve
                                ? "Resolved"
                                : sim.report.status}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/reports/${sim.report.id}`}
                          className="shrink-0 text-xs text-[#1F8F22] border border-[#1F8F22]/30 px-4 py-2 rounded-lg hover:bg-[#1F8F22] hover:text-white transition-all text-center font-semibold shadow-sm active:scale-95"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* === STANDARD GRID VIEW === */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10 py-2.5">
            {filteredReports.map((item: any) => (
              <Link to={`${item.id}`} key={item.id} className="block group">
                <div
                  className={`
                  h-72 flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${
                    item.resolve
                      ? "bg-gray-50/80 border-gray-200 opacity-75 hover:opacity-100"
                      : "bg-white border-transparent hover:border-[#1F8F22]/40 shadow-sm hover:shadow-xl hover:-translate-y-1"
                  }
                `}
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.resolve ? "bg-green-400" : "bg-amber-400 animate-pulse"}`}
                      ></span>
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase ${
                          item.resolve ? "text-[#1F8F22]" : "text-amber-600"
                        }`}
                      >
                        {item.resolve ? "Resolved" : item.status}
                      </span>
                    </div>

                    <h3
                      className={`font-bold text-lg leading-tight line-clamp-2 tracking-wide transition-colors ${
                        item.resolve
                          ? "text-gray-500 line-through decoration-gray-300"
                          : "text-[#1a1a1a] group-hover:text-[#1F8F22]"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className="text-gray-500 text-sm mt-3 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-row justify-between items-center gap-3 flex-wrap">
                    <div className="flex flex-row items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[linear-gradient(270deg,rgba(146,146,146,0.7)_0%,rgba(31,143,34,0.7)_64%,rgba(9,70,10,0.7)_100%)] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        {item.email ? item.email[0].toUpperCase() : "?"}
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {censorEmail(item.email)}
                      </span>
                    </div>

                    <div className="flex flex-row justify-between items-center text-gray-400 text-xs font-medium shrink-0">
                      <div className="flex items-center gap-1.5">
                        <CiCalendar className="text-base" />
                        <time>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div ref={observerTarget} className="flex justify-center pb-10">
            {isFetchingNextPage && (
              <span className="text-[#1F8F22] font-medium tracking-wide animate-pulse flex items-center gap-2 text-sm">
                <VscLoading className="animate-spin text-xl" />
                Loading more reports...
              </span>
            )}

            {!hasNextPage && reportsData.length > 0 && (
              <span className="text-gray-400 text-sm font-medium">
                You've reached the end!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
