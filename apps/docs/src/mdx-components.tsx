import type { MDXComponents } from "mdx/types";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import * as TypeTableComponents from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...TypeTableComponents,
    ...components,
  };
}
