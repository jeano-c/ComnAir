import React from "react";

// Official EPA AQI scale colors, descriptions, and health messages
const aqiScale = [
  {
    range: "0 - 50",
    label: "Good",
    hex: "#00E400",
    textColor: "#000000",
    desc: "Air quality is satisfactory, and air pollution poses little or no risk.",
    action: "It's a great day to be active outside.",
  },
  {
    range: "51 - 100",
    label: "Moderate",
    hex: "#FFFF00",
    textColor: "#000000",
    desc: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
    action:
      "Unusually sensitive people should consider reducing prolonged or heavy exertion.",
  },
  {
    range: "101 - 150",
    label: "Unhealthy for Sensitive Groups",
    hex: "#FF7E00",
    textColor: "#000000", // Black text on Orange for better contrast
    desc: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
    action:
      "Members of sensitive groups should reduce prolonged or heavy outdoor exertion.",
  },
  {
    range: "151 - 200",
    label: "Unhealthy",
    hex: "#FF0000",
    textColor: "#FFFFFF",
    desc: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
    action:
      "Everyone should reduce prolonged or heavy exertion. Members of sensitive groups should avoid prolonged or heavy exertion.",
  },
  {
    range: "201 - 300",
    label: "Very Unhealthy",
    hex: "#8F3F97",
    textColor: "#FFFFFF",
    desc: "Health alert: The risk of health effects is increased for everyone.",
    action:
      "Everyone should avoid prolonged or heavy exertion. Members of sensitive groups should avoid all physical activity outdoors.",
  },
  {
    range: "301+",
    label: "Hazardous",
    hex: "#7E0023",
    textColor: "#FFFFFF",
    desc: "Health warning of emergency conditions: everyone is more likely to be affected.",
    action: "Everyone should avoid all physical activity outdoors.",
  },
];

function Aqi() {
  return (
    <div className="min-h-screen bg-[#F4F4F9] p-4 sm:p-6 md:p-12 lg:p-16 flex justify-center font-sans">
      <div className="max-w-7xl w-full flex flex-col">
        {/* --- Header Section --- */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-block bg-white shadow-sm text-gray-700 text-xs font-bold px-5 py-2 rounded-full mb-6 tracking-widest uppercase border border-gray-200">
            EPA Guidelines
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            Understanding the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F8F22] to-teal-500">
              Air Quality Index
            </span>
          </h1>
          <p className="text-gray-600 max-w-2xl text-base md:text-lg leading-relaxed mx-auto md:mx-0">
            The AQI is your atmospheric compass. It runs from 0 to 500,
            translating complex pollutant concentrations into actionable health
            guidance based on official EPA standards.
          </p>
        </div>

        {/* --- The Standard Scale Section --- */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aqiScale.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 group"
              >
                {/* Colored Header Card */}
                <div
                  className="px-5 py-4 flex justify-between items-center transition-colors gap-3"
                  style={{ backgroundColor: item.hex, color: item.textColor }}
                >
                  <h3 className="text-lg md:text-xl font-bold leading-tight flex-1">
                    {item.label}
                  </h3>
                  <span className="text-2xl font-black tracking-tighter opacity-90 whitespace-nowrap">
                    {item.range}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-6 flex-grow">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Health Message
                    </h4>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Recommended Action
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Aqi;
