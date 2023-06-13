// see https://app.quicktype.io/

/**
 * https://api.spotify.com/v1/me
 */
export type SpotifyMe = {
    display_name: string
    email?: string
    external_urls: {
      spotify: string
    }
    href: string
    id: string
    images: Array<{
      width: number | null
      height: number | null
      url: string
    }>
    type: "user"
    uri: string
}
  

/**
 * https://api.spotify.com/v1/me/playlists
 */
export type SpotifyMyPlaylists = {
    href:     string;
    limit:    number;
    next:     string;
    offset:   number;
    previous: string;
    total:    number;
    items:    PlaylistBrief[];
}

/**
 * https://api.spotify.com/v1/playlists/{playlist_id}
 */
export type SpotifyGetPlaylist = {
    collaborative: boolean;
    description:   string;
    external_urls: ExternalUrls;
    followers:     Followers;
    href:          string;
    id:            string;
    images:        Image[];
    name:          string;
    owner:         Owner;
    public:        boolean;
    snapshot_id:   string;
    tracks:        Tracks;
    type:          string;
    uri:           string;
}

/**
 * https://api.spotify.com/v1/audio-features/{id}
 */
export type SpotifyAudioFeatures = {
    acousticness:     number;
    analysis_url:     string;
    danceability:     number;
    duration_ms:      number;
    energy:           number;
    id:               string;
    instrumentalness: number;
    key:              number;
    liveness:         number;
    loudness:         number;
    mode:             number;
    speechiness:      number;
    tempo:            number;
    time_signature:   number;
    track_href:       string;
    type:             string;
    uri:              string;
    valence:          number;
}

export type Image = {
    url:    string;
    height: number;
    width:  number;
}

export type Owner = {
    external_urls: ExternalUrls;
    followers?:    Followers;
    href:          string;
    id:            string;
    type:          string;
    uri:           string;
    display_name?: string;
    name?:         string;
}

export type Tracks = {
    href:     string;
    limit:    number;
    next:     string;
    offset:   number;
    previous: string;
    total:    number;
    items:    Item[];
}

export type Item = {
    added_at: string;
    added_by: Owner;
    is_local: boolean;
    track:    Track;
}

export type Track = {
    album:             Album;
    artists:           Artist[];
    available_markets: string[];
    disc_number:       number;
    duration_ms:       number;
    explicit:          boolean;
    external_ids:      ExternalIDS;
    external_urls:     ExternalUrls;
    href:              string;
    id:                string;
    is_playable:       boolean;
    linked_from:       LinkedFrom;
    restrictions:      Restrictions;
    name:              string;
    popularity:        number;
    preview_url:       string;
    track_number:      number;
    type:              string;
    uri:               string;
    is_local:          boolean;
}

export type Album = {
    album_type:             string;
    total_tracks:           number;
    available_markets:      string[];
    external_urls:          ExternalUrls;
    href:                   string;
    id:                     string;
    images:                 Image[];
    name:                   string;
    release_date:           string;
    release_date_precision: string;
    restrictions:           Restrictions;
    type:                   string;
    uri:                    string;
    copyrights:             Copyright[];
    external_ids:           ExternalIds;
    genres:                 string[];
    label:                  string;
    popularity:             number;
    album_group:            string;
    artists:                Owner[];
}

export type Copyright = {
    text: string;
    type: string;
}

export type ExternalIds = {
    isrc: string;
    ean:  string;
    upc:  string;
}

export type PlaylistBrief = {
    collaborative: boolean;
    description:   string;
    external_urls: ExternalUrls;
    href:          string;
    id:            string;
    images:        Image[];
    name:          string;
    owner:         Owner;
    public:        boolean;
    snapshot_id:   string;
    tracks:        TracksBrief;
    type:          string;
    uri:           string;
}

export type TracksBrief = {
    href:  string;
    total: number;
}

/**
 * https://api.spotify.com/v1/playlists/{playlist_id}
 */
export type SpotifyPlaylist = {
    collaborative: boolean;
    description:   string;
    external_urls: ExternalUrls;
    followers:     Followers;
    href:          string;
    id:            string;
    images:        Image[];
    name:          string;
    owner:         Owner;
    public:        boolean;
    snapshot_id:   string;
    tracks:        Tracks;
    type:          string;
    uri:           string;
}

export type ExternalUrls = {
    spotify: string;
}

export type Followers = {
    href:  string;
    total: number;
}


export type ExternalIDS = {
    isrc: string;
    ean:  string;
    upc:  string;
}

export type Restrictions = {
    reason: string;
}

export type Artist = {
    external_urls: ExternalUrls;
    followers:     Followers;
    genres:        string[];
    href:          string;
    id:            string;
    images:        Image[];
    name:          string;
    popularity:    number;
    type:          string;
    uri:           string;
}

export type LinkedFrom = object
