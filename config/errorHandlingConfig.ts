import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from "@sentry/browser";

export function useErrorHandlingConfig() {

  const setupErrorHandling = () => {

    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => {
        return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
          defaultIntegration.name,
        );
      },
    );

    // integrations.push(feedbackIntegration({
    //   colorScheme: "system",
    // }))

    const client = new BrowserClient({
      dsn: process.env.SENTRY_DSN!,
      environment: process.env.TABSETS_STAGE!,
      release: process.env.SENTRY_PROJECT_NAME + "@" + import.meta.env.PACKAGE_VERSION,
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: integrations,
    });

    const scope = new Scope();
    scope.setClient(client);
    client.init();
    return scope
  }

  return {
    setupErrorHandling
  }
}
