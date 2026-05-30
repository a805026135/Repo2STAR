export class IntegrationService {
  async pushToNotion(apiKey, pageId, resumeData) {
    const { Client } = await import('@notionhq/client');
    const notion = new Client({ auth: apiKey });

    const blocks = [];

    for (const project of resumeData.projects || []) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: project.name } }] },
      });

      for (const point of project.points || []) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              type: 'text',
              text: { content: `[${point.tag || 'STAR'}] ${point.situation} ${point.task} ${point.action} ${point.result}` },
            }],
          },
        });
      }
    }

    if (blocks.length === 0) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: 'No resume content available.' } }] },
      });
    }

    if (pageId) {
      await notion.blocks.children.append({ block_id: pageId, children: blocks });
      return { success: true, pageId, message: 'Content appended to existing page' };
    }

    const page = await notion.pages.create({
      parent: { type: 'page_id', page_id: apiKey.split('-').pop() },
      properties: {
        title: { title: [{ text: { content: 'Repo2STAR Resume' } }] },
      },
      children: blocks.slice(0, 100),
    });

    return { success: true, pageId: page.id, url: page.url };
  }

  async pushToFeishu(webhookUrl, resumeData) {
    const content = [];

    for (const project of resumeData.projects || []) {
      content.push([{ tag: 'text', text: `**${project.name}**\n` }]);
      for (const point of project.points || []) {
        content.push([{ tag: 'text', text: `- ${point.situation} ${point.action} ${point.result}\n` }]);
      }
    }

    const body = {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: 'Repo2STAR Resume Update' },
          template: 'blue',
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: content.map(line => line.map(seg => seg.text).join('')).join('') },
          },
        ],
      },
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Feishu webhook failed: ${err}`);
    }

    return { success: true, message: 'Pushed to Feishu' };
  }

  formatResumeForExport(starPoints) {
    const grouped = {};
    for (const sp of starPoints) {
      const name = sp.full_name || `repo-${sp.repo_id}`;
      if (!grouped[name]) grouped[name] = { name, points: [] };
      grouped[name].points.push({
        tag: (JSON.parse(sp.tags || '[]'))[0] || 'STAR',
        situation: sp.situation,
        task: sp.task,
        action: sp.action,
        result: sp.result,
      });
    }
    return { projects: Object.values(grouped) };
  }
}
