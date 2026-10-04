import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect } from "react";

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#111827" },
  { label: "Blue", value: "#1d4ed8" },
  { label: "Green", value: "#15803d" },
  { label: "Orange", value: "#c2410c" },
  { label: "Red", value: "#b91c1c" },
  { label: "Gray", value: "#6b7280" },
];

function ToolBtn({ active, title, onClick, children, danger }) {
  return (
    <button
      type="button"
      title={title}
      className={`rte-btn ${active ? "is-active" : ""} ${danger ? "is-danger" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

/**
 * Amazon-style description editor: paragraphs, bullets, bold/italic/color, align.
 */
const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Write product details like Amazon — features, packaging, care…",
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || value == null) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Format description">
        <ToolBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <i className="fa-solid fa-bold" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i className="fa-solid fa-italic" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <i className="fa-solid fa-underline" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <i className="fa-solid fa-strikethrough" aria-hidden="true" />
        </ToolBtn>

        <span className="rte-sep" />

        <ToolBtn
          title="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <i className="fa-solid fa-heading" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <i className="fa-solid fa-paragraph" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <i className="fa-solid fa-list-ul" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <i className="fa-solid fa-list-ol" aria-hidden="true" />
        </ToolBtn>

        <span className="rte-sep" />

        <ToolBtn
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <i className="fa-solid fa-align-left" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <i className="fa-solid fa-align-center" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <i className="fa-solid fa-align-right" aria-hidden="true" />
        </ToolBtn>

        <span className="rte-sep" />

        <label className="rte-color" title="Text color">
          <i className="fa-solid fa-palette" aria-hidden="true" />
          <select
            aria-label="Text color"
            value={editor.getAttributes("textStyle").color || ""}
            onChange={(e) => {
              const color = e.target.value;
              if (!color) editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(color).run();
            }}
          >
            {TEXT_COLORS.map((c) => (
              <option key={c.label} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <ToolBtn
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <i className="fa-solid fa-highlighter" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn title="Insert link" active={editor.isActive("link")} onClick={setLink}>
          <i className="fa-solid fa-link" aria-hidden="true" />
        </ToolBtn>

        <span className="rte-sep" />

        <ToolBtn
          title="Clear formatting"
          danger
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <i className="fa-solid fa-eraser" aria-hidden="true" />
        </ToolBtn>
      </div>

      <EditorContent editor={editor} className="rte-body" />
    </div>
  );
};

export default RichTextEditor;
