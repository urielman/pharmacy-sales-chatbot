/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "pharmacy-chatbot",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    // Database
    const database = new sst.aws.Postgres("PharmacyDatabase", {
      scaling: {
        min: "0.5 ACU",
        max: "4 ACU",
      },
    });

    // API
    const api = new sst.aws.Function("PharmacyAPI", {
      handler: "backend/src/lambda.handler",
      url: true,
      timeout: "30 seconds",
      memory: "1024 MB",
      environment: {
        DATABASE_URL: database.connectionString,
        OPENAI_API_KEY: new sst.Secret("OpenAIApiKey").value,
        PHARMACY_API_URL: "https://67e14fb758cc6bf785254550.mockapi.io/pharmacies",
        NODE_ENV: "production",
      },
      link: [database],
      nodejs: {
        install: ["@mikro-orm/core", "@mikro-orm/postgresql", "@mikro-orm/nestjs"],
      },
    });

    // Frontend
    const frontend = new sst.aws.StaticSite("PharmacyFrontend", {
      build: {
        command: "npm run build",
        output: "build",
      },
      path: "frontend",
      environment: {
        REACT_APP_API_URL: api.url,
      },
    });

    return {
      api: api.url,
      frontend: frontend.url,
      database: database.host,
    };
  },
});
