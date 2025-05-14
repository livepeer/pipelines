const TARGET_HEADER_NAME = "livepeer-playback-url";

self.addEventListener("install", event => {
  console.log("Service Worker: Installing...");
  event.waitUntil(self.skipWaiting());

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service Worker: Activating...");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.url.endsWith("/whip")) {
    console.log(
      "%%%%%% Service Worker: Intercepting fetch request to:",
      request.url,
    );

    event.respondWith(
      fetch(request)
        .then(response => {
          const clonedResponse = response.clone();
          const specificHeaderValue =
            clonedResponse.headers.get(TARGET_HEADER_NAME);

          if (specificHeaderValue) {
            console.log(
              `%%% Service Worker: Header "${TARGET_HEADER_NAME}" found:`,
              specificHeaderValue,
            );

            self.clients
              .matchAll({ type: "window", includeUncontrolled: true })
              .then(clients => {
                if (clients && clients.length) {
                  clients.forEach(client => {
                    client.postMessage({
                      type: "HEADER_FOUND",
                      payload: {
                        headerName: TARGET_HEADER_NAME,
                        headerValue: specificHeaderValue,
                        url: request.url,
                      },
                    });
                  });
                }
              });
          }
          return response;
        })
        .catch(error => {
          console.error("Service Worker: Fetch error:", error);
          return new Response(`Network error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }),
    );
  }
});
