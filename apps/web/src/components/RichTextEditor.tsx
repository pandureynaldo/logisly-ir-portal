import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ["clean"],
];

export function htmlToPlainText(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|table|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isRichTextEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
}: Props) {
  const modules = useMemo(() => ({ toolbar: TOOLBAR }), []);

  return (
    <div className="rich-editor" style={{ ["--rte-min" as string]: `${minHeight}px` }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Safe-ish display of stored HTML description. */
export function RichTextView({ html }: { html: string }) {
  if (!html?.trim()) return <span>—</span>;
  if (!html.includes("<")) return <span>{html}</span>;
  return (
    <div
      className="rich-view"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
