import { type Page } from "@/lib/source";
import { remarkNpm } from "fumadocs-core/mdx-plugins";
import { remarkInclude } from "fumadocs-mdx/config";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

const processor = remark()
  .use(remarkMdx)
  .use(remarkInclude)
  .use(remarkGfm)
  .use(remarkAutoTypeTable)
  .use(remarkNpm);

export async function getLLMText(page: Page) {
  const processed = await processor.process({
    path: page.data._file.absolutePath,
    value: page.data.content,
  });

  return `# ${page.data.title}
URL: ${page.url}
Source: https://raw.githubusercontent.com/quran/api-js/main/apps/docs/content/docs/${page.path}

${page.data.description}
        
${processed.value}`;
}
