"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type OpenApiSpec = Record<string, any>;

const docsUrl = "/api/v1/docs/reseller/openapi.json";

const apiKeySecurity = [{ apiKeyAuth: [] }];

function withApiCatalogDocs(spec: OpenApiSpec): OpenApiSpec {
  const nextSpec = {
    ...spec,
    paths: {
      ...(spec.paths || {}),
    },
    components: {
      ...(spec.components || {}),
      schemas: {
        ...(spec.components?.schemas || {}),
      },
    },
  };

  nextSpec.paths["/reseller/api/account"] = {
    get: {
      tags: ["Reseller"],
      summary: "Get API account overview",
      description:
        "Returns the authenticated API user's account summary, wallet balance, API key counts, and important endpoint links.",
      security: apiKeySecurity,
      responses: {
        "200": {
          description: "API account overview retrieved",
          content: {
            "application/json": {
              example: {
                success: true,
                message: "API account overview retrieved",
                data: {
                  user: {
                    userId: "uuid",
                    email: "partner@example.com",
                    fullName: "Partner Name",
                    phoneNumber: "08012345678",
                    role: "reseller",
                    isSuspended: false,
                  },
                  wallet: {
                    userId: "uuid",
                    balance: 12500,
                    currency: "NGN",
                    updatedAt: "2026-06-23T10:00:00.000Z",
                  },
                  apiKeys: {
                    total: 2,
                    active: 1,
                  },
                  endpoints: {
                    wallet: "/api/v1/reseller/api/wallet",
                    products: "/api/v1/reseller/api/products",
                    purchase: "/api/v1/reseller/api/purchases",
                    purchaseStatus:
                      "/api/v1/reseller/api/purchases/{requestId}",
                  },
                },
                statusCode: 200,
              },
            },
          },
        },
        "401": { description: "Missing or invalid API key" },
      },
    },
  };

  nextSpec.paths["/reseller/api/wallet"] = {
    get: {
      tags: ["Reseller"],
      summary: "Get API user wallet balance",
      description:
        "Returns the wallet balance for the reseller/API user authenticated by X-API-Key.",
      security: apiKeySecurity,
      responses: {
        "200": {
          description: "Wallet balance retrieved",
          content: {
            "application/json": {
              example: {
                success: true,
                message: "Wallet balance retrieved",
                data: {
                  userId: "uuid",
                  balance: 12500,
                  currency: "NGN",
                  updatedAt: "2026-06-23T10:00:00.000Z",
                },
                statusCode: 200,
              },
            },
          },
        },
        "401": { description: "Missing or invalid API key" },
      },
    },
  };

  nextSpec.paths["/reseller/api/products"] = {
    get: {
      tags: ["Reseller"],
      summary: "List products with API prices",
      description:
        "Returns active products that API users can inspect before purchase. Fixed-price products include apiPrice, which is the same API pricing logic used by the purchase endpoint.",
      security: apiKeySecurity,
      parameters: [
        {
          in: "query",
          name: "productType",
          schema: { type: "string", example: "data" },
        },
        {
          in: "query",
          name: "operatorCode",
          schema: { type: "string", example: "MTN" },
        },
        {
          in: "query",
          name: "categorySlug",
          schema: { type: "string", example: "sme" },
        },
        {
          in: "query",
          name: "q",
          schema: { type: "string", example: "5GB" },
        },
        { in: "query", name: "page", schema: { type: "integer", example: 1 } },
        {
          in: "query",
          name: "perPage",
          schema: { type: "integer", example: 100, maximum: 500 },
        },
      ],
      responses: {
        "200": {
          description: "API products retrieved",
          content: {
            "application/json": {
              example: {
                success: true,
                message: "API products retrieved",
                data: {
                  products: [
                    {
                      id: "uuid",
                      productCode: "MTN_5GB_SME_SHARE",
                      name: "MTN 5GB SME Share",
                      productType: "data",
                      apiPrice: 1550,
                      price: 1550,
                      priceSource: "priceTags.api",
                      priceTag: "api",
                      isFixedPrice: true,
                      dataMb: 5120,
                      validityDays: 30,
                      category: { name: "SME", slug: "sme" },
                      operator: {
                        name: "MTN",
                        code: "MTN",
                        logoUrl: "https://example.com/mtn.png",
                      },
                      isActive: true,
                      purchaseEndpoint: "/api/v1/reseller/api/purchases",
                      purchaseField: "product_code",
                    },
                  ],
                  pagination: {
                    page: 1,
                    perPage: 100,
                    total: 1,
                    totalPages: 1,
                  },
                },
                statusCode: 200,
              },
            },
          },
        },
        "401": { description: "Missing or invalid API key" },
      },
    },
  };

  nextSpec.paths["/reseller/api/products/{productCode}"] = {
    get: {
      tags: ["Reseller"],
      summary: "Get one product by product code",
      description:
        "Returns one active product by productCode, including apiPrice and purchase metadata.",
      security: apiKeySecurity,
      parameters: [
        {
          in: "path",
          name: "productCode",
          required: true,
          schema: { type: "string", example: "MTN_5GB_SME_SHARE" },
        },
      ],
      responses: {
        "200": {
          description: "API product retrieved",
          content: {
            "application/json": {
              example: {
                success: true,
                message: "API product retrieved",
                data: {
                  productCode: "MTN_5GB_SME_SHARE",
                  name: "MTN 5GB SME Share",
                  productType: "data",
                  apiPrice: 1550,
                  priceTag: "api",
                  isFixedPrice: true,
                  purchaseEndpoint: "/api/v1/reseller/api/purchases",
                  purchaseField: "product_code",
                },
                statusCode: 200,
              },
            },
          },
        },
        "401": { description: "Missing or invalid API key" },
        "404": { description: "product_code not found" },
      },
    },
  };

  return nextSpec;
}

export default function ResellerApiDocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(docsUrl)
      .then((response) => response.json())
      .then((remoteSpec) => {
        if (!cancelled) setSpec(withApiCatalogDocs(remoteSpec));
      })
      .catch(() => {
        if (!cancelled) {
          setSpec(
            withApiCatalogDocs({
              openapi: "3.0.0",
              info: {
                title: "Reseller API Documentation",
                version: "1.0.0",
              },
              paths: {},
              components: {
                securitySchemes: {
                  apiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "X-API-Key",
                  },
                },
              },
            })
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

      {spec ? (
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          deepLinking={true}
        />
      ) : (
        <div className="text-muted-foreground">Loading API docs...</div>
      )}
    </div>
  );
}
