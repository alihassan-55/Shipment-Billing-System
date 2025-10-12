import React, { useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Upload, Download, FileSpreadsheet } from "lucide-react"

const BulkImportPage = () => {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false)
      setFile(null)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-600">Import shipments and customers in bulk</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Import Shipments
            </CardTitle>
            <CardDescription>
              Upload a CSV file to import multiple shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" disabled={!file || isUploading} className="w-full">
                {isUploading ? "Uploading..." : "Upload CSV"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Download a CSV template for bulk import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Use this template to format your data correctly before importing.
              </p>
              <Button variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
          <CardDescription>
            Required columns for shipment import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium">Required Fields</h4>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• sender_name</li>
                <li>• receiver_name</li>
                <li>• destination</li>
                <li>• weight_kg</li>
                <li>• service_type</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Optional Fields</h4>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• sender_email</li>
                <li>• receiver_email</li>
                <li>• declared_value</li>
                <li>• cod_amount</li>
                <li>• dimensions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Address Fields</h4>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• pickup_address</li>
                <li>• pickup_city</li>
                <li>• pickup_state</li>
                <li>• delivery_city</li>
                <li>• delivery_state</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Date Fields</h4>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• shipment_date</li>
                <li>• expected_delivery</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BulkImportPage

