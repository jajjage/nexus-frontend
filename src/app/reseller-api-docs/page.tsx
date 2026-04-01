"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ResellerApiDocsPage() {
  // Use relative path - frontend proxies /api/v1 to backend
  const docsUrl = "/api/v1/docs/reseller/openapi.json";

  return (
    <div className="min-h-screen w-full bg-white p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Reseller API Documentation
        </h1>
        <p className="text-muted-foreground mt-2">
          Interactive API documentation for the Reseller endpoints. Use your API
          key and idempotency key to test requests.
        </p>
      </div>

      <SwaggerUI
        url={docsUrl}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        deepLinking={true}
      />
    </div>
  );
}
