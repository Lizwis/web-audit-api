const fastify = require("fastify")({
	logger: true,
	bodyLimit: 1048576 * 2,
	connectionTimeout: 0,
	keepAliveTimeout: 10000,
});

const cors = require("@fastify/cors");
fastify.register(cors, { origin: true });

const scanRoute = require("./routes/scan");
fastify.register(scanRoute, { prefix: "/api" });

const start = async () => {
	try {
		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log("🚀 Fastify backend running on http://localhost:3000");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
