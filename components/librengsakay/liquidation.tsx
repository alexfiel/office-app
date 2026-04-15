"use client";

import React, { useState } from 'react';
import { createLiquidation } from '@/lib/upload/librengsakay/liquidate-trip';

interface Trip {
  id: string;
  departureDate: Date;
  driverName: string;
  vehiclePlateNumber: string;
  numberofPax: number;
  fare: number;
  amount: number;
}

export default function LiquidationTable({ trips, userId, adminName }: { trips: Trip[], userId: string, adminName: string }) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTrip) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createLiquidation(selectedTrip.id, userId, formData);
      setSelectedTrip(null); // Close modal on success
      alert("Trip Liquidated Successfully!");
    } catch (error) {
      alert("Error liquidating trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Pending Liquidations</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 uppercase text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(trip.departureDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{trip.driverName} ({trip.vehiclePlateNumber})</td>
                <td className="px-4 py-3">{trip.numberofPax}</td>
                <td className="px-4 py-3 font-bold text-green-700">₱{trip.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedTrip(trip)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                  >
                    Liquidate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Liquidation Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Liquidate Trip</h3>
            <p className="text-sm text-gray-500 mb-4">
              Recording payment for {selectedTrip.driverName} - ₱{selectedTrip.amount}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">AR Number</label>
                <input
                  name="arnumber"
                  required
                  placeholder="e.g. AR-2026-0001"
                  className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Approved By</label>
                <input
                  name="approvedby"
                  required
                  placeholder="Department Head Name"
                  className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Hidden field for Prepared By */}
              <input type="hidden" name="preparedby" value={adminName} />

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTrip(null)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Submit Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}