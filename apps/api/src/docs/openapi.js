const buildOpenApiSpec = (serverBaseUrl) => {
  return {
    openapi: "3.0.3",
    info: {
      title: "Churn Platform API",
      version: "1.4.0",
      description: "Node backend API for churn operations with JWT auth, RBAC, and email verification."
    },
    servers: [
      {
        url: `${serverBaseUrl}/api/v1`,
        description: "API v1"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          tags: ["Health"],
          responses: { "200": { description: "Service healthy" } }
        }
      },
      "/contact": {
        post: {
          summary: "Submit public contact request",
          tags: ["Contact"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "message"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    company: { type: "string" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Contact submitted" },
            "400": { description: "Validation failed" },
            "429": { description: "Too many requests" }
          }
        }
      },
      "/auth/register": {
        post: {
          summary: "Register user (public, default role agent after first user)",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                    role: { type: "string", enum: ["admin", "manager", "agent"] }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "User registered" },
            "409": { description: "User already exists" }
          }
        }
      },
      "/auth/login": {
        post: {
          summary: "Login",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Login success" },
            "401": { description: "Invalid credentials" },
            "403": { description: "Email not verified" }
          }
        }
      },
      "/auth/verify-email": {
        post: {
          summary: "Verify email with token",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "token"],
                  properties: {
                    email: { type: "string", format: "email" },
                    token: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Email verified" },
            "400": { description: "Invalid or expired token" }
          }
        }
      },
      "/auth/resend-verification": {
        post: {
          summary: "Resend verification email",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Verification email sent (or generic success)" },
            "429": { description: "Resend cooldown active" }
          }
        }
      },
      "/auth/me": {
        get: {
          summary: "Current authenticated user",
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Current user" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/auth/users": {
        get: {
          summary: "List users (admin)",
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Users list" },
            "403": { description: "Forbidden" }
          }
        },
        post: {
          summary: "Create user with role (admin)",
          tags: ["Auth"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "role"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                    role: { type: "string", enum: ["admin", "manager", "agent"] }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "User created" }
          }
        }
      },
      "/customers": {
        get: {
          summary: "List customers",
          tags: ["Customers"],
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Customer list" } }
        },
        post: {
          summary: "Create customer (admin/manager)",
          tags: ["Customers"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Customer created" } }
        }
      },
      "/customers/{customerId}": {
        get: {
          summary: "Get customer",
          tags: ["Customers"],
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "customerId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Customer" } }
        },
        patch: {
          summary: "Update customer (admin/manager)",
          tags: ["Customers"],
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "customerId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Customer updated" } }
        }
      },
      "/scoring/predict": {
        post: {
          summary: "Score customer churn",
          tags: ["Scoring"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Scored" } }
        }
      },
      "/scoring/batch": {
        post: {
          summary: "Batch score customers",
          tags: ["Scoring"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Batch scored" } }
        }
      },
      "/scoring/latest": {
        get: {
          summary: "Latest prediction per customer",
          tags: ["Scoring"],
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Latest predictions list" } }
        }
      },
      "/scoring/history/{customerId}": {
        get: {
          summary: "Prediction history",
          tags: ["Scoring"],
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "customerId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "History" } }
        }
      },
      "/dashboard/summary": {
        get: {
          summary: "Dashboard summary metrics",
          tags: ["Dashboard"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "days",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 365, default: 30 },
              description: "Rolling window for recent metrics"
            }
          ],
          responses: { "200": { description: "Summary metrics" } }
        }
      },
      "/actions": {
        get: {
          summary: "List retention actions",
          tags: ["Actions"],
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Actions" } }
        },
        post: {
          summary: "Create retention action",
          tags: ["Actions"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Action created" } }
        }
      },
      "/actions/{actionId}": {
        patch: {
          summary: "Update retention action (admin/manager)",
          tags: ["Actions"],
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "actionId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Action updated" } }
        }
      },
      "/outcomes": {
        get: {
          summary: "List customer outcomes",
          tags: ["Outcomes"],
          security: [{ BearerAuth: [] }],
          responses: { "200": { description: "Outcomes list" } }
        },
        post: {
          summary: "Record customer outcome",
          tags: ["Outcomes"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Outcome recorded" } }
        }
      },
      "/outcomes/customer/{customerId}": {
        get: {
          summary: "Get outcomes for a customer",
          tags: ["Outcomes"],
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "customerId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Customer outcomes" } }
        }
      },
      "/import/telco/path": {
        post: {
          summary: "Import telco dataset by path (admin/manager)",
          tags: ["Import"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Imported" } }
        }
      },
      "/import/telco/upload": {
        post: {
          summary: "Import telco dataset by upload (admin/manager)",
          tags: ["Import"],
          security: [{ BearerAuth: [] }],
          responses: { "201": { description: "Imported" } }
        }
      }
    }
  };
}

module.exports = { buildOpenApiSpec };
