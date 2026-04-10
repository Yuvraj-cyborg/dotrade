const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello World!");
  },
});

console.log(`Server running at http://localhost:${server.port}`);
