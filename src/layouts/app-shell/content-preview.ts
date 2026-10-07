import type { ContentTab } from './content-tab';

import { BookOpenIcon, FileTextIcon } from '@lucide/vue';

import EditorPreviewDocument from '@/features/editor/EditorPreviewDocument.vue';

const previewDocuments = [
    {
        id: 'chapter-one',
        name: 'The Last Light',
        kind: 'manuscript',
        path: ['Manuscript', 'Part One', 'The Last Light'],
        content: `<h1>The Last Light</h1>
            <p>The lighthouse went dark just before dawn. From the harbor, Mira watched its beam
            sweep across the water one final time, then disappear into the mist.</p>
            <p>For three hundred years, someone had kept that light burning. Tonight, for the
            first time, no one answered the bell.</p>
            <blockquote><p>“If the light ever fails, stay away from the shore.”</p></blockquote>
            <p>Her father had said it so often that it had become a joke. Standing on the empty
            pier with his letter in her pocket, she no longer found it funny.</p>`,
    },
    {
        id: 'chapter-two',
        name: 'Across the Harbor',
        kind: 'manuscript',
        path: ['Manuscript', 'Part One', 'Across the Harbor'],
        content: `<h1>Across the Harbor</h1>
            <p>By noon, every boat in the harbor had returned except one.</p>
            <p>Mira found the ferryman beside the old customs house, repairing a net that had
            never belonged to him. He looked up before she spoke.</p>
            <p>“You want to cross,” he said. “Everyone does, until they see the other side.”</p>
            <h2>Notes for this scene</h2>
            <ul><li>Introduce the ferryman and his connection to the lighthouse.</li>
            <li>Mira discovers that her father left the island three days earlier.</li>
            <li>End with the sound of a bell coming from beneath the water.</li></ul>`,
    },
    {
        id: 'mira',
        name: 'Mira Voss',
        kind: 'wiki',
        path: ['Wiki', 'Characters', 'Mira Voss'],
        content: `<h1>Mira Voss</h1>
            <p><strong>Role:</strong> Cartographer and reluctant keeper of the lighthouse.</p>
            <h2>Background</h2>
            <p>Raised above her father's map shop, Mira learned to read coastlines before she
            could read words. She left the island at nineteen and swore she would never return.</p>
            <h2>Motivation</h2>
            <p>Find her missing father and understand why his final map shows an island that
            does not appear on any chart.</p>
            <h2>Details</h2>
            <ul><li>Carries a brass compass that always points toward the lighthouse.</li>
            <li>Distrusts sailors, despite knowing every ship in the harbor.</li>
            <li>Draws maps from memory when she cannot sleep.</li></ul>`,
    },
    {
        id: 'greyhaven',
        name: 'Greyhaven',
        kind: 'wiki',
        path: ['Wiki', 'Locations', 'Greyhaven'],
        content: `<h1>Greyhaven</h1>
            <p>A small island port at the edge of the northern shipping routes. Most visitors
            remember the fog; those who stay remember the bells.</p>
            <h2>The harbor</h2>
            <p>Stone warehouses line the eastern quay. At low tide, a second road appears
            beneath the pier, leading toward the ruins of the original settlement.</p>
            <h2>Landmarks</h2>
            <ul><li><strong>The lighthouse:</strong> Built on a black rock beyond the breakwater.</li>
            <li><strong>Voss Maps:</strong> A narrow shop overlooking the fish market.</li>
            <li><strong>The old customs house:</strong> Abandoned after the winter storms.</li></ul>
            <blockquote><p>No ship leaves Greyhaven without a bell on its mast.</p></blockquote>`,
    },
];

export function createPreviewTabs(): ContentTab[] {
    return previewDocuments.map((document) => ({
        id: `preview:${document.id}`,
        title: document.name,
        icon: document.kind === 'wiki' ? BookOpenIcon : FileTextIcon,
        breadcrumbs: document.path.map((name, index) => ({ id: String(index), name })),
        component: EditorPreviewDocument,
        props: { content: document.content },
    }));
}

export function createPreviewTab(number: number): ContentTab {
    const title = `Draft ${number}`;

    return {
        id: `preview:draft-${number}`,
        title,
        icon: FileTextIcon,
        breadcrumbs: [
            { id: 'manuscript', name: 'Manuscript' },
            { id: 'drafts', name: 'Drafts' },
            { id: `draft-${number}`, name: title },
        ],
        component: EditorPreviewDocument,
        props: {
            content: `<h1>${title}</h1>
                <p>This is sample draft ${number}. Use this space to try a new scene,
                collect ideas, or explore the editor layout.</p>`,
        },
    };
}
