"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export default function ReferralsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Referrals</h1>
      <p className="text-muted-foreground mb-8">
        Invite your friends and family to join our platform and earn rewards.
      </p>

      {/* Referral Program */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Share your referral link with friends and family. When they sign up and complete their first service, you'll
            both receive a reward.
          </p>
          <div className="bg-input rounded-lg p-4 flex items-center justify-between">
            <code className="text-sm font-mono">homease.com/ref/sophia-clark-2024</code>
            <Button variant="ghost" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Status */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Friend's Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Reward</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Emily Carter", status: "Completed", reward: "$10" },
                  { name: "David Lee", status: "Pending", reward: "$0" },
                  { name: "Olivia Brown", status: "Invited", reward: "$0" },
                ].map((referral, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-3 px-4">{referral.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          referral.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : referral.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{referral.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
