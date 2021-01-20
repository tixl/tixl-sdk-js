const settings: EnvironmentOptions = {
  appGateway: process.env.REACT_APP_GATEWAY || '',
};

export type EnvironmentOptions = {
  appGateway?: string;
};

export function setEnvironment(opts: EnvironmentOptions) {
  // copy settings
  if (opts.appGateway) {
    settings.appGateway = opts.appGateway;
  }
}

export function getGatewayUrl() {
  return settings.appGateway;
}
