import { describe, it, expect } from 'vitest';
import { getChronologicalScenes } from './exportEpub';
import { TextNode } from '../types/project';

describe('exportEpub - getChronologicalScenes', () => {
  it('correctly traverses tree hierarchy depth-first and extracts scenes in order', () => {
    const chapters: TextNode[] = [
      { id: 'act-1', title: 'Act I', type: 'folder', content: '', parentId: null },
      { id: 'ch-1', title: 'Chapter 1', type: 'folder', content: '', parentId: 'act-1' },
      { id: 'sc-1', title: 'Scene 1', type: 'scene', content: 'Intro text', parentId: 'ch-1' },
      { id: 'sc-2', title: 'Scene 2', type: 'scene', content: 'Middle text', parentId: 'ch-1' },
      { id: 'act-2', title: 'Act II', type: 'folder', content: '', parentId: null },
      { id: 'sc-3', title: 'Scene 3', type: 'scene', content: 'Climax text', parentId: 'act-2' },
      { id: 'standalone', title: 'Epilogue', type: 'scene', content: 'Ending text', parentId: null },
    ];

    const scenes = getChronologicalScenes(chapters);
    expect(scenes.map((s) => s.id)).toEqual(['sc-1', 'sc-2', 'sc-3', 'standalone']);
  });

  it('handles empty chapters gracefully', () => {
    const scenes = getChronologicalScenes([]);
    expect(scenes).toEqual([]);
  });

  it('handles scenes without folders', () => {
    const chapters: TextNode[] = [
      { id: 's1', title: 'Scene 1', type: 'scene', content: '1', parentId: null },
      { id: 's2', title: 'Scene 2', type: 'scene', content: '2', parentId: null },
    ];
    const scenes = getChronologicalScenes(chapters);
    expect(scenes.map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('resolves author from context blocks, characters, or default label', async () => {
    const { resolveProjectAuthor } = await import('./exportEpub');
    const { createEmptyProject } = await import('../types/project');

    const project1 = createEmptyProject();
    expect(resolveProjectAuthor(project1)).toBe('Foliant Author');

    const project2 = createEmptyProject();
    project2.contextBlocks = [
      { id: 'b1', title: 'Author Name', type: 'text', content: 'Brandon Sanderson' },
    ];
    expect(resolveProjectAuthor(project2)).toBe('Brandon Sanderson');

    const project3 = createEmptyProject();
    project3.characters = [
      { id: 'c1', name: 'Kaladin Stormblessed', role: 'Protagonist', summary: 'Windrunner' },
    ];
    expect(resolveProjectAuthor(project3)).toBe('Kaladin Stormblessed');
  });

  it('correctly retrieves descendant scenes for folders', async () => {
    const { getDescendantScenes } = await import('./exportEpub');
    const chapters: TextNode[] = [
      { id: 'part-1', title: 'Part 1', type: 'folder', content: '', parentId: null },
      { id: 'ch-1', title: 'Chapter 1', type: 'folder', content: '', parentId: 'part-1' },
      { id: 'sc-1', title: 'Scene 1', type: 'scene', content: 'Intro', parentId: 'ch-1' },
      { id: 'sc-2', title: 'Scene 2', type: 'scene', content: 'Middle', parentId: 'ch-1' },
      { id: 'ch-2', title: 'Chapter 2', type: 'folder', content: '', parentId: 'part-1' },
      { id: 'sc-3', title: 'Scene 3', type: 'scene', content: 'Climax', parentId: 'ch-2' },
    ];

    const partScenes = getDescendantScenes('part-1', chapters);
    expect(partScenes.map((s) => s.id)).toEqual(['sc-1', 'sc-2', 'sc-3']);

    const ch1Scenes = getDescendantScenes('ch-1', chapters);
    expect(ch1Scenes.map((s) => s.id)).toEqual(['sc-1', 'sc-2']);
  });

  it('generateTocNcx assigns strictly sequential playOrder and unique targets (RSC-005 compliance)', async () => {
    const { generateTocNcx } = await import('./exportEpub');

    const sampleEntries = [
      { title: 'Title Page', src: 'titlepage.xhtml' },
      {
        title: 'Part 1',
        src: 'part_1.xhtml',
        children: [
          { title: 'Chapter 1', src: 'chapter_1.xhtml' },
          { title: 'Chapter 2', src: 'chapter_2.xhtml' },
        ],
      },
      {
        title: 'Part 2',
        src: 'part_2.xhtml',
        children: [
          { title: 'Chapter 3', src: 'chapter_3.xhtml' },
        ],
      },
    ];

    const ncxXml = generateTocNcx('urn:uuid:test', 'Book Title', 'Author', sampleEntries);

    // Extract all playOrder values
    const playOrderMatches = [...ncxXml.matchAll(/playOrder="(\d+)"/g)].map((m) =>
      Number(m[1])
    );

    // 1. Must start at 1
    expect(playOrderMatches[0]).toBe(1);

    // 2. Must be strictly sequential: 1, 2, 3, 4, 5, 6
    expect(playOrderMatches).toEqual([1, 2, 3, 4, 5, 6]);

    // 3. Extract all content src values
    const srcMatches = [...ncxXml.matchAll(/<content src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcMatches.length).toBe(playOrderMatches.length);

    // 4. All targets must be unique
    const uniqueTargets = new Set(srcMatches);
    expect(uniqueTargets.size).toBe(srcMatches.length);
  });

  it('generateUuidV4 produces valid RFC 4122 UUIDv4 strings', async () => {
    const { generateUuidV4 } = await import('./exportEpub');
    const uuid = generateUuidV4();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('generateEpubCss creates exact standard profile p rule with line-height 1.4, widows/orphans 2, margin-bottom 0.5em, text-indent 1em', async () => {
    const { generateEpubCss } = await import('./exportEpub');
    const css = generateEpubCss('standard');

    const pRuleMatch = css.match(/p\s*\{([^}]+)\}/);
    expect(pRuleMatch).toBeTruthy();
    const pRuleContent = pRuleMatch![1];

    expect(pRuleContent).toMatch(/line-height:\s*1\.4;/);
    expect(pRuleContent).toMatch(/widows:\s*2;/);
    expect(pRuleContent).toMatch(/orphans:\s*2;/);
    expect(pRuleContent).toMatch(/margin-bottom:\s*0\.5em;/);
    expect(pRuleContent).toMatch(/text-indent:\s*1em;/);
  });

  it('generateEpubCss creates strictly purged amazon profile p rule with only margin: 0 and text-indent: 1em', async () => {
    const { generateEpubCss } = await import('./exportEpub');
    const css = generateEpubCss('amazon');

    const pRuleMatch = css.match(/p\s*\{([^}]+)\}/);
    expect(pRuleMatch).toBeTruthy();
    const pRuleContent = pRuleMatch![1];

    expect(pRuleContent).toMatch(/margin:\s*0;/);
    expect(pRuleContent).toMatch(/text-indent:\s*1em;/);
    expect(pRuleContent).not.toContain('line-height');
    expect(pRuleContent).not.toContain('widows');
    expect(pRuleContent).not.toContain('orphans');
    expect(pRuleContent).not.toContain('margin-bottom');
    expect(pRuleContent).not.toContain('margin-top');
  });

  it('generateTocXhtml produces root html tag with lang and xml:lang declaration', async () => {
    const { generateTocXhtml } = await import('./exportEpub');
    const xhtmlEs = generateTocXhtml([{ title: 'Chapter 1', src: 'chapter_1.xhtml' }], 'es');
    expect(xhtmlEs).toMatch(/<html[^>]+lang="es"[^>]+xml:lang="es"/);

    const xhtmlEn = generateTocXhtml([{ title: 'Chapter 1', src: 'chapter_1.xhtml' }], 'en');
    expect(xhtmlEn).toMatch(/<html[^>]+lang="en"[^>]+xml:lang="en"/);
  });

  describe('formatChapterBody - TipTap sanitization and paragraph box model', () => {
    it('removes empty paragraphs, ProseMirror breaks, and non-breaking spaces', async () => {
      const { formatChapterBody } = await import('./exportEpub');
      const input = `
        <p>First valid paragraph.</p>
        <p></p>
        <p><br></p>
        <p><br class="ProseMirror-trailingBreak" /></p>
        <p>&nbsp;</p>
        <p>&#160;</p>
        <p><span></span></p>
        <p>Second valid paragraph.</p>
      `;

      const result = formatChapterBody(input);
      expect(result).not.toContain('<p></p>');
      expect(result).not.toContain('<p><br /></p>');
      expect(result).not.toContain('<p><br></p>');
      expect(result).not.toContain('ProseMirror-trailingBreak');
      expect(result).toContain('<p>First valid paragraph.</p>');
      expect(result).toContain('<p>Second valid paragraph.</p>');
    });

    it('does not inject <br> tags between text blocks', async () => {
      const { formatChapterBody } = await import('./exportEpub');
      const input = '<p>Paragraph 1</p><br /><p>Paragraph 2</p><br><p>Paragraph 3</p>';
      const result = formatChapterBody(input);

      // No <br> between </p> and <p>
      expect(result).not.toMatch(/<\/p>\s*<br\s*\/?>\s*<p>/);
      expect(result).toContain('<p>Paragraph 1</p>');
      expect(result).toContain('<p>Paragraph 2</p>');
      expect(result).toContain('<p>Paragraph 3</p>');
    });

    it('replaces single newlines in markdown with space instead of injecting <br />', async () => {
      const { formatChapterBody } = await import('./exportEpub');
      const markdown = 'This is line one\nof the exact same paragraph.';
      const result = formatChapterBody(markdown);

      expect(result).not.toContain('<br');
      expect(result).toBe('<p>This is line one of the exact same paragraph.</p>');
    });

    it('parses TipTap JSON doc discarding empty paragraphs and without injecting breaks', async () => {
      const { formatChapterBody } = await import('./exportEpub');
      const doc = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello from TipTap JSON' }],
          },
          {
            type: 'paragraph',
          },
          {
            type: 'paragraph',
            content: [{ type: 'hardBreak' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Second paragraph with ' },
              { type: 'text', text: 'bold text', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      });

      const result = formatChapterBody(doc);
      expect(result).not.toContain('<p></p>');
      expect(result).toContain('<p>Hello from TipTap JSON</p>');
      expect(result).toContain('<p>Second paragraph with <strong>bold text</strong></p>');
    });

    it('amazon profile aggressively purges any <br> tags and empty paragraphs', async () => {
      const { formatChapterBody } = await import('./exportEpub');
      const input = '<p>First line<br />inside paragraph</p><p></p><p><br></p><p>Second paragraph<br>with break</p>';
      const result = formatChapterBody(input, 'amazon');

      expect(result).not.toContain('<br');
      expect(result).not.toContain('<p></p>');
      expect(result).toContain('<p>First line inside paragraph</p>');
      expect(result).toContain('<p>Second paragraph with break</p>');
    });
  });

  describe('Heading Visual Hierarchy (Acts <h1> vs Chapters <h2>)', () => {
    it('generateEpubCss contains exact h1 and h2 base heading rules for both profiles', async () => {
      const { generateEpubCss } = await import('./exportEpub');

      for (const profile of ['standard', 'amazon'] as const) {
        const css = generateEpubCss(profile);

        // h1 base rule
        const h1Match = css.match(/h1\s*\{([^}]+)\}/);
        expect(h1Match).toBeTruthy();
        const h1Css = h1Match![1];
        expect(h1Css).toMatch(/font-size:\s*2em;/);
        expect(h1Css).toMatch(/text-align:\s*center;/);
        expect(h1Css).toMatch(/margin-top:\s*15%;/);
        expect(h1Css).toMatch(/margin-bottom:\s*2em;/);
        expect(h1Css).toMatch(/page-break-before:\s*always;/);

        // h2 base rule
        const h2Match = css.match(/h2\s*\{([^}]+)\}/);
        expect(h2Match).toBeTruthy();
        const h2Css = h2Match![1];
        expect(h2Css).toMatch(/font-size:\s*1\.5em;/);
        expect(h2Css).toMatch(/text-align:\s*center;/);
        expect(h2Css).toMatch(/margin-top:\s*10%;/);
        expect(h2Css).toMatch(/margin-bottom:\s*1\.5em;/);
        expect(h2Css).toMatch(/page-break-before:\s*always;/);
      }
    });

    it('buildEpubArchive wraps Level 1 / Act in <h1> and Level 2 / Chapter in <h2> in sub-folders mode', async () => {
      const { buildEpubArchive } = await import('./exportEpub');
      const { createEmptyProject } = await import('../types/project');

      const project = createEmptyProject();
      project.title = 'Epic Fantasy';
      project.chapters = [
        { id: 'act-1', title: 'Acto I: El Despertar', type: 'folder', content: '', parentId: null },
        { id: 'ch-1', title: 'Capítulo 1: La Huida', type: 'folder', content: '', parentId: 'act-1' },
        { id: 'sc-1', title: 'Escena 1', type: 'scene', content: '<p>Texto de la escena 1.</p>', parentId: 'ch-1' },
      ];

      const built = buildEpubArchive(project, {
        chapterFormatting: 'sub-folders',
        includeVisualToc: true,
      });

      // 1. Acto I (Nivel 1): part_1.xhtml must contain <h1>Acto I: El Despertar</h1>
      const part1File = built.zip.file('OEBPS/part_1.xhtml');
      expect(part1File).toBeTruthy();
      const part1Content = await part1File!.async('string');
      expect(part1Content).toContain('<h1>Acto I: El Despertar</h1>');
      expect(part1Content).not.toContain('<h2>Acto I: El Despertar</h2>');

      // 2. Capítulo 1 (Nivel 2): chapter_1.xhtml must contain <h2>Capítulo 1: La Huida</h2>
      const ch1File = built.zip.file('OEBPS/chapter_1.xhtml');
      expect(ch1File).toBeTruthy();
      const ch1Content = await ch1File!.async('string');
      expect(ch1Content).toContain('<h2>Capítulo 1: La Huida</h2>');
      expect(ch1Content).not.toContain('<h1>Capítulo 1: La Huida</h1>');

      // 3. Nested scene heading should be <h3>
      expect(ch1Content).toContain('<h3 class="scene-heading">Escena 1</h3>');

      // 4. Title page must NOT contain 'Generated with Foliant' branding
      const titlePageFile = built.zip.file('OEBPS/titlepage.xhtml');
      expect(titlePageFile).toBeTruthy();
      const titlePageContent = await titlePageFile!.async('string');
      expect(titlePageContent).not.toContain('Generated with Foliant');
    });

    it('generates titlepage.xhtml with semantic h1.book-title and h2.book-author without "by", and optional publisher', async () => {
      const { buildEpubArchive } = await import('./exportEpub');
      const { createEmptyProject } = await import('../types/project');

      const project = createEmptyProject();
      project.title = 'El Nombre del Viento';
      project.chapters = [
        { id: 'ch-1', title: 'Capítulo 1', type: 'folder', content: '', parentId: null },
        { id: 'sc-1', title: 'Escena 1', type: 'scene', content: '<p>Texto.</p>', parentId: 'ch-1' },
      ];

      // Test with publisher
      const builtWithPublisher = buildEpubArchive(project, {
        title: 'El Nombre del Viento',
        author: 'Patrick Rothfuss',
        publisher: 'Editorial Nova · 2007',
      });

      const titleHtml = await builtWithPublisher.zip.file('OEBPS/titlepage.xhtml')!.async('string');
      expect(titleHtml).toContain('<h1 class="book-title">El Nombre del Viento</h1>');
      expect(titleHtml).toContain('<h2 class="book-author">Patrick Rothfuss</h2>');
      expect(titleHtml).not.toContain('by Patrick Rothfuss');
      expect(titleHtml).toContain('<p class="book-publisher">Editorial Nova · 2007</p>');

      const opfXml = await builtWithPublisher.zip.file('OEBPS/content.opf')!.async('string');
      expect(opfXml).toContain('<dc:publisher>Editorial Nova · 2007</dc:publisher>');

      // Test without publisher
      const builtWithoutPublisher = buildEpubArchive(project, {
        title: 'El Nombre del Viento',
        author: 'Patrick Rothfuss',
      });
      const titleHtmlNoPub = await builtWithoutPublisher.zip.file('OEBPS/titlepage.xhtml')!.async('string');
      expect(titleHtmlNoPub).toContain('<h1 class="book-title">El Nombre del Viento</h1>');
      expect(titleHtmlNoPub).toContain('<h2 class="book-author">Patrick Rothfuss</h2>');
      expect(titleHtmlNoPub).not.toContain('class="book-publisher"');
    });

    it('generateEpubCss includes exact title page rules for .book-title, .book-author, and .book-publisher', async () => {
      const { generateEpubCss } = await import('./exportEpub');
      const css = generateEpubCss('standard');

      expect(css).toMatch(/\.book-title\s*\{[^}]*font-size:\s*2\.5em;/);
      expect(css).toMatch(/\.book-title\s*\{[^}]*font-weight:\s*bold;/);
      expect(css).toMatch(/\.book-title\s*\{[^}]*margin-top:\s*20vh;/);
      expect(css).toMatch(/\.book-title\s*\{[^}]*margin-bottom:\s*0\.2em;/);
      expect(css).toMatch(/\.book-title\s*\{[^}]*letter-spacing:\s*2px;/);

      expect(css).toMatch(/\.book-author\s*\{[^}]*font-size:\s*1\.5em;/);
      expect(css).toMatch(/\.book-author\s*\{[^}]*font-weight:\s*normal;/);
      expect(css).toMatch(/\.book-author\s*\{[^}]*margin-top:\s*2em;/);
      expect(css).toMatch(/\.book-author\s*\{[^}]*font-style:\s*italic;/);

      expect(css).toMatch(/\.book-publisher\s*\{[^}]*font-size:\s*1em;/);
      expect(css).toMatch(/\.book-publisher\s*\{[^}]*margin-top:\s*4em;/);
      expect(css).toMatch(/\.book-publisher\s*\{[^}]*text-transform:\s*uppercase;/);
    });
  });

  describe('Optional Visual Table of Contents (includeVisualToc)', () => {
    it('when includeVisualToc is true: generates toc.xhtml and adds visual-toc to spine, while preserving nav.xhtml and toc.ncx', async () => {
      const { buildEpubArchive } = await import('./exportEpub');
      const { createEmptyProject } = await import('../types/project');

      const project = createEmptyProject();
      project.chapters = [
        { id: 'ch-1', title: 'Capítulo 1', type: 'folder', content: '', parentId: null },
        { id: 'sc-1', title: 'Escena 1', type: 'scene', content: '<p>Contenido.</p>', parentId: 'ch-1' },
      ];

      const built = buildEpubArchive(project, { includeVisualToc: true });

      // toc.xhtml must exist in OEBPS
      expect(built.zip.file('OEBPS/toc.xhtml')).toBeTruthy();
      // nav.xhtml must exist in OEBPS
      expect(built.zip.file('OEBPS/nav.xhtml')).toBeTruthy();
      // toc.ncx must exist in OEBPS
      expect(built.zip.file('OEBPS/toc.ncx')).toBeTruthy();

      // content.opf checks
      const opfFile = built.zip.file('OEBPS/content.opf');
      const opfXml = await opfFile!.async('string');

      expect(opfXml).toContain('<item id="visual-toc" href="toc.xhtml" media-type="application/xhtml+xml"/>');
      expect(opfXml).toContain('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
      expect(opfXml).toContain('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');
      expect(opfXml).toContain('<itemref idref="visual-toc"/>');
      expect(opfXml).toContain('<reference type="toc" title="Table of Contents" href="toc.xhtml"/>');
    });

    it('when includeVisualToc is false: omits toc.xhtml and spine visual-toc, but strictly keeps nav.xhtml and toc.ncx intact', async () => {
      const { buildEpubArchive } = await import('./exportEpub');
      const { createEmptyProject } = await import('../types/project');

      const project = createEmptyProject();
      project.chapters = [
        { id: 'ch-1', title: 'Capítulo 1', type: 'folder', content: '', parentId: null },
        { id: 'sc-1', title: 'Escena 1', type: 'scene', content: '<p>Contenido.</p>', parentId: 'ch-1' },
      ];

      const built = buildEpubArchive(project, { includeVisualToc: false });

      // toc.xhtml must NOT exist in OEBPS
      expect(built.zip.file('OEBPS/toc.xhtml')).toBeNull();

      // System navigation MUST strictly remain intact
      expect(built.zip.file('OEBPS/nav.xhtml')).toBeTruthy();
      expect(built.zip.file('OEBPS/toc.ncx')).toBeTruthy();

      // content.opf checks
      const opfFile = built.zip.file('OEBPS/content.opf');
      const opfXml = await opfFile!.async('string');

      // Must NOT contain visual-toc in manifest, spine, or guide
      expect(opfXml).not.toContain('id="visual-toc"');
      expect(opfXml).not.toContain('idref="visual-toc"');
      expect(opfXml).not.toContain('<reference type="toc"');

      // MUST retain system nav.xhtml and toc.ncx
      expect(opfXml).toContain('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
      expect(opfXml).toContain('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');
      expect(opfXml).toContain('<spine toc="ncx">');
    });
  });
});




