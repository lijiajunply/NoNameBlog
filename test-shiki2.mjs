import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { renderToStaticMarkup } from "react-dom/server";

const prettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: true,
};

const source = "```csharp\nvar a = 1;\n```";
const { content } = await compileMDX({
  source,
  options: {
    mdxOptions: {
      rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    },
  },
});

console.log(renderToStaticMarkup(content));
