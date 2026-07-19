"use client";

import { AdminNav } from "@/components/dashboard/AdminNav";
import { useEffect, useState } from "react";
import { api, auth } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  customerName: string;
  phoneNumber: string;
  fullAddress: string;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = auth.getToken();

    if (!token) {
      router.push("/");
      return;
    }

    const loadUsers = async () => {
      try {
        const data = await api.getUsers(token);
        setUsers(data.users);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [router]);

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();

    return (
      user.customerName?.toLowerCase().includes(search) ||
      user.phoneNumber.includes(search)
    );
  });

  return (
    <>
      <AdminNav />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clients</h1>

              <p className="text-gray-500 mt-1">
                Manage all registered clients.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 text-center min-w-[170px]">
              <p className="text-sm text-gray-600">Total Clients</p>

              <h2 className="text-3xl font-bold text-orange-600">
                {users.length}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}

        {/* search clients cart  */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Client List
                </h2>

                <p className="text-sm text-gray-500">
                  Search clients by name or phone number.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Name
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Phone
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Address
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Orders
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Spent
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Status
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No matching clients found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.customerName || "-"}
                        </td>

                        <td className="px-6 py-4 font-mono">
                          {user.phoneNumber}
                        </td>

                        <td
                          className="px-6 py-4 max-w-xs truncate"
                          title={user.fullAddress}
                        >
                          {user.fullAddress || "-"}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {user.totalOrders}
                        </td>

                        <td className="px-6 py-4 text-center">
                          ₹{user.totalSpent?.toFixed(2) || "0.00"}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {new Date(user.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
