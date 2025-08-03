import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Calendar, 
  DollarSign, 
  FileText, 
  Home, 
  Shield, 
  ClipboardList,
  Users,
  Settings,
  Bell
} from "lucide-react";

export default function SidebarDemoPage() {
  const stats = [
    {
      title: "Total Applications",
      value: "24",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Active Properties",
      value: "12",
      icon: Building,
      color: "bg-green-500",
    },
    {
      title: "Pending Documents",
      value: "8",
      icon: Shield,
      color: "bg-yellow-500",
    },
    {
      title: "Monthly Revenue",
      value: "$45,230",
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ];

  const recentActivity = [
    {
      title: "New application submitted",
      description: "John Doe submitted application for Apt 4F",
      time: "2 hours ago",
      type: "application",
    },
    {
      title: "Document uploaded",
      description: "Pay stubs uploaded for application #1234",
      time: "4 hours ago",
      type: "document",
    },
    {
      title: "Application approved",
      description: "Application #1234 has been approved",
      time: "1 day ago",
      type: "approval",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your rental application portal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Start New Application
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              View My Applications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building className="h-4 w-4 mr-2" />
              Browse Properties
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Features Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Collapsible</h3>
              <p className="text-sm text-gray-600">Click the hamburger menu to collapse/expand</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Navigation</h3>
              <p className="text-sm text-gray-600">Easy access to all application features</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">User Menu</h3>
              <p className="text-sm text-gray-600">Account settings and logout options</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 