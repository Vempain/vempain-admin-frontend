import {ApiTokenManagement, ApiTokenNetworkSource, ApiTokenScope} from "@vempain/vempain-common-frontend";
import dayjs from "dayjs";
import {apiTokenAPI, userAPI} from "../services";
import {formatDateTime, stickyTableHeader} from "../tools";

export function ApiTokens() {
    return <ApiTokenManagement
            api={apiTokenAPI}
            userAPI={userAPI}
            scopeOptions={[
                {value: ApiTokenScope.FILE_SERVICE, label: "FILE_SERVICE"},
                {value: ApiTokenScope.MCP_READ, label: "MCP_READ (GET /mcp/** only)"}
            ]}
            defaultScope={ApiTokenScope.FILE_SERVICE}
            descriptionPlaceholder="vempain-file-backend production"
            creationTitle="Create API token"
            description="API tokens are restricted by scope, network and expiry. MCP_READ tokens can only call GET /mcp endpoints; FILE_SERVICE keeps the existing file-service endpoint allowlist."
            networkHint={suggestion => {
                switch (suggestion?.source) {
                    case ApiTokenNetworkSource.PRIVATE_NETWORK:
                        return "Pre-filled with the private network the admin backend shares with the other services; pick another one from the list if the file backend reaches this service over a different network.";
                    case ApiTokenNetworkSource.CONFIGURED:
                        return "Pre-filled from the configured default network (vempain.admin.api-token.default-network).";
                    default:
                        return "A single address is a /32 (IPv4) or /128 (IPv6) network. Enter the network the file backend calls from; behind a proxy that is its real source network, not the proxy's.";
                }
            }}
            createdTokenDescription={token => `Configure it as ENV_VEMPAIN_ADMIN_BACKEND_API_TOKEN of the calling service (${token.description}, network ${token.network}, expires ${formatDateTime(dayjs(token.expires_at))})`}
            sticky={stickyTableHeader}
            formatDateTime={formatDateTime}
    />;
}
