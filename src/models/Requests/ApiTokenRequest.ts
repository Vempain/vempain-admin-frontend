export interface ApiTokenRequest {
    description: string;
    /** IPv4 or IPv6 network in CIDR notation; a plain address means a single host */
    network: string;
    /** ISO instant, must be in the future */
    expires_at: string;
}
