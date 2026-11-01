# Twenty is self-hosted next to proopco

Twenty runs on proopco's own infrastructure (Docker, with its own Postgres and Redis) on a private network with proopco, rather than on Twenty Cloud. The reasons are Iranian payment rails, sensitive trader data, sanctions risk and latency. Sync traffic never crosses the public internet. Apps are deployed with `twenty app publish --private --remote production`.
