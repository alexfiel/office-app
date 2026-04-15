"use client"

import { useState } from "react"
import Papa from 'papaparse'
import { uploadTrips } from "@/lib/upload/librengsakay/upload-trips"

interface CSVRow {
    departureDate: string;
    driverName: string;
    vehiclePlateNumber: string;
    numberofPax: string;
    fare: string;
}

interface LibrengSakayRoute {
    id: string;
    routeName: string;
    fare: number;
}

export default function TripUpload({ userId, routes }: { userId: string, routes: LibrengSakayRoute[] }) {
    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [data, setData] = useState<CSVRow[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");

    const selectedRoute = routes.find(r => r.id === selectedRouteId);


    // 1. Handle File Selection and Parsing
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rawData = results.data as any[];
                const normalizedData = rawData.map(row => {
                    const cleanRow: any = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.toLowerCase().replace(/\s/g, '');
                        cleanRow[normalizedKey] = row[key];
                    });
                    
                    // Map to core structure, ignoring any system-level keys in CSV
                    return {
                        departureDate: cleanRow.departuredate || cleanRow.depaturedate || cleanRow.date || "N/A",
                        driverName: cleanRow.drivername || cleanRow.driver || "N/A",
                        vehiclePlateNumber: cleanRow.vehicleplate || cleanRow.vehicleplatenumber || cleanRow.plate || "N/A",
                        numberofPax: cleanRow.numberofpax || cleanRow.pax || "0",
                        fare: cleanRow.fare || cleanRow.price || (selectedRoute?.fare.toString() || "0")
                    };
                });
                setData(normalizedData);
                setMessage(`Successfully parsed ${results.data.length} rows.`);
            },
            error: (error) => {
                setMessage("Error parsing CSV: " + error.message);
            }
        });
    };

    // 2. Submit to Database
    const handleConfirmUpload = async () => {
        if (!selectedRouteId) {
            alert("Please select a route first!");
            return;
        }
        setIsUploading(true);
        try {
            await uploadTrips(data, userId, selectedRouteId);
            setMessage(`Successfully saved ${data.length} trips to ${selectedRoute?.routeName}.`);
            setData([]);
            setSelectedRouteId("");
        } catch (err) {
            setMessage("Error: " + (err as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">1. Select Target Route</label>
                        {selectedRoute && (
                            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                SYSTEM SUPPLIED
                            </span>
                        )}
                    </div>
                    <select
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                    >
                        <option value="">-- Choose a Route --</option>
                        {routes.map(r => (
                            <option key={r.id} value={r.id}>{r.routeName} (₱{r.fare})</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">2. Upload CSV File</label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={!selectedRouteId}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 ${message.toLowerCase().includes("error") ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                    <span className="text-sm font-medium">{message}</span>
                </div>
            )}

            {/* Preview Table */}
            {data.length > 0 && (
                <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Preview Trips</h3>
                            <p className="text-xs text-gray-500">Records will be assigned to <span className="font-bold text-blue-600">{selectedRoute?.routeName}</span></p>
                        </div>
                        <button
                            onClick={handleConfirmUpload}
                            disabled={isUploading || !selectedRouteId}
                            className="w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            {isUploading ? "Syncing to Server..." : `Save ${data.length} Trips`}
                        </button>
                    </div>

                    <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900 border-b">Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 border-b">Driver</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 border-b">Plate #</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-right border-b">Pax</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-right border-b">Fare</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{row.departureDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{row.driverName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{row.vehiclePlateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{row.numberofPax}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-mono">₱{row.fare}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 10 && (
                            <div className="p-3 text-center text-gray-500 text-xs italic bg-gray-50 border-t">
                                + {data.length - 10} additional records pending upload
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}