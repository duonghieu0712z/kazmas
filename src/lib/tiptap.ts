import type { Node } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/vue-3';

import { isNodeSelection } from '@tiptap/vue-3';

export function isMarkInSchema(editor: Editor | null, markName: string) {
    if (!editor?.schema) {
        return false;
    }
    return editor.schema.spec.marks.get(markName) !== undefined;
}

export function isNodeInSchema(editor: Editor | null, nodeName: string) {
    if (!editor?.schema) {
        return false;
    }
    return editor.schema.spec.nodes.get(nodeName) !== undefined;
}

export function isExtensionAvailable(editor: Editor | null, extensionNames: string | string[]) {
    if (!editor) {
        return false;
    }

    const names = Array.isArray(extensionNames) ? extensionNames : [extensionNames];
    const found = names.some((name) =>
        editor.extensionManager.extensions.some((ext) => ext.name === name),
    );

    if (!found) {
        console.warn(
            `None of the extensions [${names.join(', ')}] were found in the editor schema. Ensure they are included in the editor configuration.`,
        );
    }

    return found;
}

export function isNodeTypeSelected(editor: Editor | null, types: string[] = []) {
    if (!editor?.state.selection) {
        return false;
    }

    const { selection } = editor.state;
    if (selection.empty) {
        return false;
    }

    if (isNodeSelection(selection)) {
        const node = selection.node;
        return node ? types.includes(node.type.name) : false;
    }

    return false;
}

export function isValidPosition(pos?: number): pos is number {
    return typeof pos === 'number' && pos >= 0;
}

export function findNodeAtPosition(editor: Editor, pos: number) {
    try {
        const node = editor.state.doc.nodeAt(pos);
        if (!node) {
            console.warn(`No node found at position ${pos}`);
            return null;
        }
        return node;
    } catch (error) {
        console.error(`Error finding node at position ${pos}:`, error);
        return null;
    }
}

export function findNodePosition(editor: Editor, props: { node?: Node; pos?: number }) {
    if (!editor.state.doc) {
        return null;
    }

    const { node, pos } = props;
    if (!node && !isValidPosition(pos)) {
        return null;
    }

    if (node) {
        let foundPos = -1;
        let foundNode: Node = null!;

        editor.state.doc.descendants((currentNode, pos) => {
            if (currentNode === node) {
                foundPos = pos;
                foundNode = currentNode;
                return false;
            }
            return true;
        });

        if (foundNode && foundPos !== -1) {
            return { node: foundNode, pos: foundPos };
        }
    }

    if (isValidPosition(pos)) {
        const nodeAtPos = findNodeAtPosition(editor, pos);
        if (nodeAtPos) {
            return { node: nodeAtPos, pos };
        }
    }

    return null;
}

export interface ProtocolOptions {
    scheme: string;
    optionalSlashes?: boolean;
}

export type ProtocolConfig = Array<ProtocolOptions | string>;

const ATTR_WHITESPACE = new RegExp(
    `[${[
        '\\u0000-\\u0020',
        '\\u00A0',
        '\\u1680',
        '\\u180E',
        '\\u2000-\\u2029',
        '\\u205F',
        '\\u3000',
    ].join('')}]`,
    'g',
);

export function isAllowedUri(uri?: string, protocols?: ProtocolConfig) {
    const allowedProtocols = [
        'http',
        'https',
        'ftp',
        'ftps',
        'mailto',
        'tel',
        'callto',
        'sms',
        'cid',
        'xmpp',
    ];

    protocols?.forEach((protocol) => {
        const scheme = typeof protocol === 'string' ? protocol : protocol.scheme;
        if (scheme) {
            allowedProtocols.push(scheme);
        }
    });

    if (!uri) {
        return true;
    }

    const protocolsPattern = allowedProtocols
        .map((protocol) => protocol.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .join('|');
    const pattern = `^(?:(?:${protocolsPattern}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`;
    return new RegExp(pattern, 'i').test(uri.replace(ATTR_WHITESPACE, ''));
}

export function sanitizeUrl(inputUrl: string, baseUrl: string, protocols?: ProtocolConfig) {
    try {
        const url = new URL(inputUrl, baseUrl);
        if (isAllowedUri(url.href, protocols)) {
            return url.href;
        }
    } catch {
        return '#';
    }

    return '#';
}
