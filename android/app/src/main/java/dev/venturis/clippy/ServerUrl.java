package dev.venturis.clippy;

import java.net.URI;
import java.net.URISyntaxException;

/** The single validation boundary for every Android HTTP request. */
final class ServerUrl {
    static String normalize(String input, boolean debug) {
        if (input == null || input.trim().isEmpty()) throw new IllegalArgumentException("Enter a full server URL, including http:// or https://.");
        String value = input.trim().replaceAll("/+$", "");
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (!("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)))
                throw new IllegalArgumentException("Include http:// or https:// before the server address.");
            if (uri.getHost() == null || uri.getHost().isEmpty() || uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null
                || (uri.getRawPath() != null && !uri.getRawPath().isEmpty()) || uri.getPort() == 0 || uri.getPort() > 65535)
                throw new IllegalArgumentException("Use a server origin such as http://10.0.2.2:4173, without a path, query, or sign-in details.");
            if (!debug && !"https".equalsIgnoreCase(scheme)) throw new IllegalArgumentException("Release builds require a secure HTTPS connection. Use https:// for this server.");
            return scheme.toLowerCase(java.util.Locale.ROOT) + "://" + uri.getRawAuthority();
        } catch (URISyntaxException error) { throw new IllegalArgumentException("Enter a valid absolute server URL, including http:// or https://."); }
    }
    static String endpoint(String input, String path, boolean debug) {
        String base = normalize(input, debug);
        if (path == null || !path.matches("/api/[A-Za-z0-9/_-]+")) throw new IllegalArgumentException("Invalid API path.");
        return base + path;
    }
}
