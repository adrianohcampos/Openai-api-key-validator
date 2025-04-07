"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react"

export default function ApiKeyValidator() {
  const [apiKey, setApiKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [keyValidation, setKeyValidation] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const [creditValidation, setCreditValidation] = useState<{
    performed: boolean
    hasCredits: boolean
    message: string
    errorDetails?: string
  } | null>(null)

  const validateApiKey = async () => {
    if (!apiKey.trim()) return

    setIsValidating(true)
    setKeyValidation(null)
    setCreditValidation(null)

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      // Set key validation result
      setKeyValidation({
        valid: data.valid,
        message: data.keyValidationMessage || data.error || "API key validation completed.",
      })

      // Set credit validation result if key is valid
      if (data.valid && data.creditCheckPerformed) {
        setCreditValidation({
          performed: true,
          hasCredits: data.hasCredits,
          message: data.creditCheckMessage || "Credit check completed.",
          errorDetails: data.creditErrorDetails,
        })
      }
    } catch (error) {
      setKeyValidation({
        valid: false,
        message: "An error occurred during validation. Please try again.",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">OpenAI API Key Validator</CardTitle>
          <CardDescription>Enter your OpenAI API key to validate if it's working correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Your API key is only sent to the OpenAI API for validation and is not stored.
              </p>
            </div>

            {/* API Key Validation Alert */}
            {keyValidation && (
              <Alert variant={keyValidation.valid ? "default" : "destructive"}>
                {keyValidation.valid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{keyValidation.valid ? "API Key Valid" : "API Key Invalid"}</AlertTitle>
                <AlertDescription>{keyValidation.message}</AlertDescription>
              </Alert>
            )}

            {/* Credit Validation Alert */}
            {creditValidation && creditValidation.performed && (
              <Alert variant={creditValidation.hasCredits ? "default" : "warning"}>
                {creditValidation.hasCredits ? <CreditCard className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{creditValidation.hasCredits ? "Credits Available" : "Credit Issue"}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{creditValidation.message}</p>
                  {creditValidation.errorDetails && (
                    <p className="text-xs opacity-80">{creditValidation.errorDetails}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={validateApiKey} disabled={isValidating || !apiKey.trim()} className="w-full">
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Validate API Key"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

