package dev.promptlm.store.github;

import java.net.URL;

public interface RemoteRepository {

    String getOwnerName();

    String getName();

    URL getHtmlUrl();

    String getHttpTransportUrl();
}
