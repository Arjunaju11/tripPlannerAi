import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "TripPlannerAI API", version: "1.0.0" },
    servers: [{ url: "/api/v1" }]
  },
  apis: ["src/routes/*.ts"]
});
