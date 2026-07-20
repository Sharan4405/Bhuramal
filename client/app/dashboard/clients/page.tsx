"use client";

import { AdminNav } from "@/components/dashboard/AdminNav";
import { useEffect, useState } from "react";
import { api, auth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
          <div className="mb-6 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search by client name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-4 focus:ring-[rgb(var(--orange))]/10 transition-all"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Address
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Orders
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Spent
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-500"
                      >
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {user.customerName || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-700">
                            {user.phoneNumber}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          {user.fullAddress || "-"}
                        </td>

                        <td className="px-6 py-4 text-center font-semibold">
                          {user.totalOrders}
                        </td>

                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                          ₹{user.totalSpent?.toLocaleString() || 0}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <Badge variant={user.isActive ? "success" : "error"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
