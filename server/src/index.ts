import { config } from "dotenv";
config();

import mainRouter from "./internal/mainRouter.js";
import express from "express";
import cors from "cors";
import chalk from "chalk";
import { apiRouter } from "./internal/api/apiRouter.js";
import webhooksRouter from "./external/webhooks/webhooksRouter.js";
import { envMiddleware } from "./middleware/envMiddleware.js";
import pg from "pg";

import { serve } from "inngest/express";
import { functions } from "./trigger/inngest.js";
import { inngest } from "./trigger/inngest.js";

const app = express();

const init = async () => {
  const pgClient = new pg.Client(process.env.SUPABASE_CONNECTION_STRING || "");
  await pgClient.connect();
  app.use((req: any, res, next) => {
    req.pg = pgClient;
    next();
  });

  app.use(cors());
  app.use((req: any, res, next) => {
    const method = req.method;
    const path = req.url;
    const methodToColor: any = {
      GET: chalk.green,
      POST: chalk.yellow,
      PUT: chalk.blue,
      DELETE: chalk.red,
      PATCH: chalk.magenta,
    };

    const methodColor: any = methodToColor[method] || chalk.gray;

    console.log(
      `${chalk.gray(new Date().toISOString())} ${methodColor(
        method
      )} ${chalk.white(path)}`
    );

    next();
  });

  app.use(envMiddleware);

  app.use("/webhooks", webhooksRouter);
  app.use(express.json());
  app.use("/api/inngest", serve({ client: inngest, functions }));

  app.use(mainRouter);
  app.use("/v1", apiRouter);

  const PORT = 8080;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

init();
