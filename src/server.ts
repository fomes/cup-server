import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { authRoutes } from "./routes/auth";
import { poolRoutes } from "./routes/pool";
import { gameRoutes } from "./routes/game";
import { usersRoutes } from "./routes/users";
import { guessRoutes } from "./routes/guess";

const port = process.env.PORT;
const secret = process.env.SECRET;

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(jwt, {
    secret,
  });

  await fastify.register(authRoutes);
  await fastify.register(poolRoutes);
  await fastify.register(gameRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(guessRoutes);

  await fastify.listen({ port, host: "0.0.0.0" });
}

bootstrap();
