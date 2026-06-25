PRAGMA application_id = 1264209235;
PRAGMA user_version = 0;

CREATE TABLE IF NOT EXISTS nodes (
    id BLOB PRIMARY KEY CHECK (length(id) = 16),
    parent_id BLOB CHECK (parent_id IS NULL OR length(parent_id) = 16) REFERENCES nodes(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Untitled' CHECK (length(trim(name)) > 0),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    modified_at INTEGER NOT NULL CHECK (modified_at > 0),
    deleted_at INTEGER CHECK (deleted_at IS NULL OR deleted_at > 0)
);

CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_kind ON nodes(kind);

CREATE TABLE IF NOT EXISTS node_metadata (
    node_id BLOB PRIMARY KEY CHECK (length(node_id) = 16) REFERENCES nodes(id) ON DELETE CASCADE,
    data BLOB NOT NULL CHECK (json_valid(data, 6))
);

CREATE TABLE IF NOT EXISTS documents (
    node_id BLOB PRIMARY KEY CHECK (length(node_id) = 16) REFERENCES nodes(id) ON DELETE CASCADE,
    content BLOB NOT NULL CHECK (json_valid(content, 6))
);
