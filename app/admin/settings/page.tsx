"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage platform settings and configuration</p>

      {/* Commission & Fees */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commission & Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform Commission (%)</label>
            <Input type="number" defaultValue="15" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Processing Fee (%)</label>
            <Input type="number" defaultValue="2.5" />
          </div>
          <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Verification Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Identity Verification</p>
              <p className="text-xs text-muted-foreground">Required for all providers</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Background Check</p>
              <p className="text-xs text-muted-foreground">Required for certain service categories</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Insurance Verification</p>
              <p className="text-xs text-muted-foreground">Required for all providers</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Support & Legal */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
            <span className="text-sm font-medium">Contact Support</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
            <span className="text-sm font-medium">Terms of Service</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
            <span className="text-sm font-medium">Privacy Policy</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
