import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { randomBytes } from "node:crypto";
import { GenericContainer, Network, Wait } from "testcontainers";

/**
 * Runs the built Docker image against a fresh Postgres, the way it runs in production.
 * Build the image first with `pnpm e2e:image`, or point E2E_IMAGE at another tag.
 */
export default async function startApp() {
  const image = process.env.E2E_IMAGE ?? "job-tracker:e2e";
  const network = await new Network().start();
  const postgres = await new PostgreSqlContainer("postgres:17-alpine")
    .withNetwork(network)
    .withNetworkAliases("postgres")
    .start();
  const databaseUrl = `postgres://${postgres.getUsername()}:${postgres.getPassword()}@postgres:5432/${postgres.getDatabase()}`;

  const app = await new GenericContainer(image)
    .withNetwork(network)
    .withEnvironment({ DATABASE_URL: databaseUrl, AUTH_SECRET: randomBytes(32).toString("base64") })
    .withExposedPorts(3000)
    .withWaitStrategy(Wait.forHttp("/api/health", 3000))
    // The app's own output, so a failure to start shows why, not just a timeout.
    .withLogConsumer((stream) => stream.on("data", (line) => process.stdout.write(`[app] ${line}`)))
    .start();
  process.env.E2E_BASE_URL = `http://${app.getHost()}:${app.getMappedPort(3000)}`;

  return async () => {
    await app.stop();
    await postgres.stop();
    await network.stop();
  };
}
