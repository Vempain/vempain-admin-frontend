/** A service-to-service API token as listed; the secret is never part of it */
export interface ApiTokenResponse {
    id: number;
    token_prefix: string;
    description: string;
    network: string;
    expires_at: string;
    owner_user_id: number;
    created: string;
    last_used: string | null;
    expired: boolean;
}

/** Answer to a creation: the only time the token string is visible */
export interface ApiTokenCreatedResponse {
    token: string;
    api_token: ApiTokenResponse;
}

/** Where the suggested token network comes from */
export const ApiTokenNetworkSource = {
    CONFIGURED: 'CONFIGURED' as const,
    PRIVATE_NETWORK: 'PRIVATE_NETWORK' as const,
    NONE: 'NONE' as const
};
export type ApiTokenNetworkSource = typeof ApiTokenNetworkSource[keyof typeof ApiTokenNetworkSource];

export interface ApiTokenNetworkCandidate {
    network: string;
    interface_name: string;
    address: string;
}

/** The network the admin backend proposes for a new token; null when the administrator has to enter it */
export interface ApiTokenNetworkResponse {
    network: string | null;
    source: ApiTokenNetworkSource;
    candidates: ApiTokenNetworkCandidate[];
}
