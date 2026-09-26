// ts-node-dev type-checks each file against a program seeded from the entry
// file's import graph; an ambient `declare module` that nothing else
// imports (src/types/morgan-json.d.ts) isn't reliably picked up without an
// explicit reference here, even with tsconfig's `include`/`ts-node.files`.
/// <reference path="../../types/morgan-json.d.ts" />
import morgan from "morgan";
import morganJSON from "morgan-json";
import { Application } from "express";
import { logger } from "./logger";

interface HTTPLoggerParams {
  method: string;
  url: string;
  status: string;
  responseTime: string;
}

class HTTPLoggerStream {
  write(message: string) {
    const data: HTTPLoggerParams = JSON.parse(message);

    if (Number(data.status) >= 400) {
      logger.error(JSON.stringify({ ...data }, null, 2));
    } else if (Number(data.status) >= 300 && Number(data.status) < 400) {
      logger.warn(JSON.stringify({ ...data }, null, 2));
    } else {
      logger.info(JSON.stringify({ ...data }, null, 2));
    }
  }
}

export default (app: Application) => {
  const httpLoggerParams: Record<keyof HTTPLoggerParams, string> = {
    method: ":method",
    url: ":url",
    status: ":status",
    responseTime: ":response-time",
  };

  const format = morganJSON(httpLoggerParams);

  app.use(
    morgan(format, {
      stream: new HTTPLoggerStream(),
    })
  );
};
